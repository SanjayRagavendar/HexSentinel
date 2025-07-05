import json
import subprocess
import os
import dotenv
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from web3 import Web3
from web3.exceptions import TransactionNotFound, TimeExhausted
from pdf_report_generator import main as generate_pdf_report

dotenv.load_dotenv(".env")

# Base severity multipliers that get adjusted by confidence
BASE_SEVERITY_WEIGHTS = {
    "High": 40.0,
    "Medium": 20.0,
    "Low": 10.0,
    "Informational": 5.0
}

# Confidence multipliers that modify the base severity
CONFIDENCE_MULTIPLIERS = {
    "High": 1.0,
    "Medium": 0.8,
    "Low": 0.6
}

# Default values for prevalence and exploitability
DEFAULT_PREVALENCE = 2
DEFAULT_EXPLOITABILITY = 2

def run_slither(project_dir="test_env"):
    """Load existing Slither JSON output."""
    os.chdir(project_dir)
    # Use the existing slither output from the current directory
    output_file = "slither-output.json"
    os.remove(output_file) if os.path.exists(output_file) else None

    os.system("npx hardhat compile")
    os.system(f"slither . --json {output_file}")

    with open(output_file) as f:
        return json.load(f)

def extract_issues(slither_json):
    """Extract detector IDs, severity (impact), and confidence levels."""
    issues = []
    for detector in slither_json.get("results", {}).get("detectors", []):
        issues.append({
            "id": detector.get("check"),
            "impact": detector.get("impact", "Low"),
            "confidence": detector.get("confidence", "Low")
        })
    return issues

def calculate_threat_score(issues):
    """Calculate weighted threat score using dynamic severity-confidence scoring."""
    total_score = 0
    detailed_scores = []

    for issue in issues:
        impact = issue.get("impact", "Low")
        confidence = issue.get("confidence", "Low")

        # Get base severity weight
        base_severity = BASE_SEVERITY_WEIGHTS.get(impact, 1.0)
        confidence_multiplier = CONFIDENCE_MULTIPLIERS.get(confidence, 1.0)
        
        # Dynamic severity weight = base severity * confidence multiplier
        dynamic_severity_weight = base_severity * confidence_multiplier

        # Higher exploitability and prevalence for high and medium severity issues
        if impact in ["High", "Medium"]:
            prevalence = 3
            exploitability = 3
        else:
            prevalence = DEFAULT_PREVALENCE
            exploitability = DEFAULT_EXPLOITABILITY

        score = dynamic_severity_weight * prevalence * exploitability

        detailed_scores.append({
            "detector": issue["id"],
            "impact": impact,
            "confidence": confidence,
            "base_severity": base_severity,
            "confidence_mult": confidence_multiplier,
            "dynamic_weight": round(dynamic_severity_weight, 2),
            "score": round(score, 2)
        })

        total_score += score

    # Normalization based on max possible score
    # Max score: High (25.0) * High confidence (1.0) * 3 * 3 = 225.0
    normalized = min((total_score / 300.0) * 500, 500)
    return round(total_score, 2), round(normalized, 2), detailed_scores

def display_results(raw, normalized, details):
    print("\n[+] Threat Report")
    print("------------------------------")
    for d in details:
        print(f"  - {d['detector']} ({d['impact']}, {d['confidence']})")
        print(f"    Base: {d['base_severity']} × Confidence: {d['confidence_mult']} = Dynamic Weight: {d['dynamic_weight']}")
        print(f"    Final Score: {d['score']} pts")
        print()

    print(f"[+] Raw Threat Score: {raw}")
    print(f"[+] Normalized Score (/500): {normalized}")

    if normalized >= 400:
        print("[!] 🔥 CRITICAL Threat Level")
    elif normalized >= 300:
        print("[!] ⚠️ HIGH Threat Level")
    elif normalized >= 150:
        print("[!] ⚙️ MODERATE Threat Level")
    else:
        print("[!] 🧩 LOW Threat Level")

def upload_report(pdf_path):
    """Upload PDF report to AWS S3 bucket."""
    print(f"[+] Uploading report to AWS S3...")
    
    # Get AWS credentials and bucket info from environment variables
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')  # Default to us-east-1
    bucket_name = os.getenv('S3_BUCKET_NAME')
    
    print(f"[+] AWS Region: {aws_region}")
    print(f"[+] S3 Bucket: {bucket_name}")
    print(f"[+] AWS Access Key ID: {'***' + aws_access_key_id[-4:] if aws_access_key_id else 'Not set'}")
    
    if not aws_access_key_id or not aws_secret_access_key or not bucket_name:
        print("[-] Missing required AWS environment variables:")
        print("    - AWS_ACCESS_KEY_ID")
        print("    - AWS_SECRET_ACCESS_KEY") 
        print("    - S3_BUCKET_NAME")
        print("    - AWS_REGION (optional, defaults to us-east-1)")
        return None
    
    try:
        # Create S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        
        # Generate unique filename with timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(pdf_path)
        s3_key = f"security-reports/{timestamp}_{filename}"
        
        print(f"[+] Uploading {filename} to s3://{bucket_name}/{s3_key}")
        
        # Upload the file
        with open(pdf_path, "rb") as file:
            s3_client.upload_fileobj(
                file, 
                bucket_name, 
                s3_key,
                ExtraArgs={
                    'ContentType': 'application/pdf',
                    'ContentDisposition': f'inline; filename="{filename}"',
                    'Metadata': {
                        'report-type': 'security-analysis',
                        'generated-by': 'hexsentinel',
                        'timestamp': timestamp
                    }
                }
            )
        
        # Generate presigned URL for easy access (valid for 7 days)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': s3_key},
            ExpiresIn=7*24*3600  # 7 days
        )
        
        print("[+] ✅ Report uploaded successfully!")
        print(f"[+] S3 Object Key: {s3_key}")
        print(f"[+] S3 URL: s3://{bucket_name}/{s3_key}")
        print(f"[+] Presigned URL (7 days): {presigned_url}")
        
        return {
            'bucket': bucket_name,
            'key': s3_key,
            'url': f"s3://{bucket_name}/{s3_key}",
            'presigned_url': presigned_url
        }
        
    except NoCredentialsError:
        print("[-] ❌ AWS credentials not found or invalid")
        print("    Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set correctly")
        return None
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"[-] ❌ AWS S3 upload failed: {error_code}")
        print(f"[-] Error details: {error_message}")
        
        if error_code == 'NoSuchBucket':
            print(f"[-] The bucket '{bucket_name}' does not exist or you don't have access to it")
        elif error_code == 'AccessDenied':
            print(f"[-] Access denied. Check your AWS credentials and bucket permissions")
        
        return None
        
    except Exception as e:
        print(f"[-] ❌ Unexpected error during upload: {str(e)}")
        return None

def submit_to_polygon_amoy(analysis_data, s3_url=None):
    """Submit security analysis results to Polygon Amoy testnet."""
    print(f"[+] Submitting analysis to Polygon Amoy network...")
    
    # Get Polygon network configuration from environment
    polygon_rpc_url = os.getenv('POLYGON_AMOY_RPC_URL', 'https://rpc-amoy.polygon.technology')
    private_key = os.getenv('POLYGON_PRIVATE_KEY')
    contract_address = os.getenv('POLYGON_CONTRACT_ADDRESS')
    
    print(f"[+] RPC URL: {polygon_rpc_url}")
    print(f"[+] Contract Address: {contract_address}")
    print(f"[+] Private Key: {'***' + private_key[-4:] if private_key else 'Not set'}")
    
    if not private_key or not contract_address:
        print("[-] Missing required Polygon environment variables:")
        print("    - POLYGON_PRIVATE_KEY")
        print("    - POLYGON_CONTRACT_ADDRESS")
        print("    - POLYGON_AMOY_RPC_URL (optional, defaults to public RPC)")
        return None
    
    try:
        # Connect to Polygon Amoy
        w3 = Web3(Web3.HTTPProvider(polygon_rpc_url))
        
        if not w3.is_connected():
            print("[-] ❌ Failed to connect to Polygon Amoy network")
            return None
        
        print(f"[+] ✅ Connected to Polygon Amoy network")
        print(f"[+] Chain ID: {w3.eth.chain_id}")
        print(f"[+] Latest block: {w3.eth.block_number}")
        
        # Get account from private key
        account = w3.eth.account.from_key(private_key)
        address = account.address
        balance = w3.eth.get_balance(address)
        balance_matic = w3.from_wei(balance, 'ether')
        
        print(f"[+] Account: {address}")
        print(f"[+] Balance: {balance_matic:.4f} MATIC")
        
        if balance_matic < 0.01:  # Minimum balance check
            print("[-] ⚠️ Low MATIC balance. You may need more MATIC for transaction fees")
        
        # Prepare transaction data
        raw_score = analysis_data['raw_score']
        normalized_score = analysis_data['normalized_score']
        vulnerability_count = analysis_data['vulnerability_count']
        threat_level = analysis_data['threat_level']
        
        # AuditRegistry contract ABI - only the submitReport function
        contract_abi = [
            {
                "inputs": [
                    {"internalType": "address", "name": "_contractAudited", "type": "address"},
                    {"internalType": "enum AuditRegistry.ThreatLevel", "name": "_level", "type": "uint8"},
                    {"internalType": "uint256", "name": "_threatScore", "type": "uint256"},
                    {"internalType": "string", "name": "_cid", "type": "string"},
                    {"internalType": "uint8", "name": "_auditVersion", "type": "uint8"}
                ],
                "name": "submitReport",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        
        # Create contract instance
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(contract_address),
            abi=contract_abi
        )
        
        # Map threat levels to contract enum values
        # ThreatLevel enum: Low = 0, Medium = 1, High = 2, Critical = 3, VeryHigh = 4
        threat_level_mapping = {
            "LOW": 0,
            "MODERATE": 1, 
            "HIGH": 2,
            "CRITICAL": 3
        }
        
        threat_level_int = threat_level_mapping.get(threat_level.replace("🧩 ", "").replace("⚙️ ", "").replace("⚠️ ", "").replace("🔥 ", ""), 0)
        
        # Prepare function call
        analyzed_contract = Web3.to_checksum_address("0x65a4d19418dfe8c134ea018ffaa32c7621f7e512")
        report_uri = s3_url or "ipfs://placeholder"
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(address)
        
        transaction = contract.functions.submitReport(
            analyzed_contract,
            threat_level_int,
            int(normalized_score),
            report_uri,
            1  # audit_version
        ).build_transaction({
            'from': address,
            'nonce': nonce,
            'gas': 300000,  # Increased gas limit
            'gasPrice': w3.to_wei('30', 'gwei'),  # Gas price
            'chainId': w3.eth.chain_id
        })
        
        print(f"[+] Preparing transaction...")
        print(f"    Contract Audited: {analyzed_contract}")
        print(f"    Threat Level: {threat_level} -> {threat_level_int}")
        print(f"    Threat Score: {normalized_score} -> {int(normalized_score)}")
        print(f"    Report CID: {report_uri}")
        print(f"    Audit Version: 1")
        print(f"    Gas Limit: {transaction['gas']}")
        print(f"    Gas Price: {w3.from_wei(transaction['gasPrice'], 'gwei')} Gwei")
        
        # Estimate gas cost
        estimated_gas = contract.functions.submitReport(
            analyzed_contract,
            threat_level_int,
            int(normalized_score),
            report_uri,
            1
        ).estimate_gas({'from': address})
        
        gas_cost = w3.from_wei(estimated_gas * transaction['gasPrice'], 'ether')
        print(f"    Estimated Gas Cost: {gas_cost:.6f} MATIC")
        
        # Sign transaction
        signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
        
        # Send transaction
        print(f"[+] Sending transaction to Polygon Amoy...")
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        tx_hash_hex = tx_hash.hex()
        
        print(f"[+] Transaction sent! Hash: {tx_hash_hex}")
        print(f"[+] Waiting for confirmation...")
        
        # Wait for transaction receipt
        try:
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)  # 5 minutes timeout
            
            if receipt.status == 1:
                print(f"[+] ✅ Transaction confirmed!")
                print(f"    Block Number: {receipt.blockNumber}")
                print(f"    Gas Used: {receipt.gasUsed}")
                print(f"    Transaction Fee: {w3.from_wei(receipt.gasUsed * transaction['gasPrice'], 'ether'):.6f} MATIC")
                print(f"    Explorer: https://amoy.polygonscan.com/tx/{tx_hash_hex}")
                
                return {
                    'success': True,
                    'tx_hash': tx_hash_hex,
                    'block_number': receipt.blockNumber,
                    'gas_used': receipt.gasUsed,
                    'explorer_url': f"https://amoy.polygonscan.com/tx/{tx_hash_hex}",
                    'contract_address': contract_address
                }
            else:
                print(f"[-] ❌ Transaction failed!")
                return None
                
        except TimeExhausted:
            print(f"[-] ⏰ Transaction timeout. Check status manually: https://amoy.polygonscan.com/tx/{tx_hash_hex}")
            return {
                'success': False,
                'tx_hash': tx_hash_hex,
                'status': 'timeout',
                'explorer_url': f"https://amoy.polygonscan.com/tx/{tx_hash_hex}"
            }
    
    except Exception as e:
        print(f"[-] ❌ Error submitting to Polygon: {str(e)}")
        return None

def main():
    print("[+] Running Slither analysis on Hardhat project...")
    slither_output = run_slither()
    issues = extract_issues(slither_output)
    raw, normalized, details = calculate_threat_score(issues)
    display_results(raw, normalized, details)
    
    # Determine threat level based on normalized score
    if normalized >= 400:
        threat_level = "🔥 CRITICAL"
    elif normalized >= 200:
        threat_level = "⚠️ HIGH"
    elif normalized >= 100:
        threat_level = "⚙️ MODERATE"
    else:
        threat_level = "🧩 LOW"
    
    print("\n[+] Generating PDF report...")
    pdf_path = generate_pdf_report()
    
    if pdf_path and os.path.exists(pdf_path):
        print(f"[+] PDF report generated: {pdf_path}")
        upload_result = upload_report(pdf_path)
        
        s3_url = None
        if upload_result:
            s3_url = upload_result['presigned_url']
            print(f"\n[+] 🎉 Report uploaded to S3!")
            print(f"    Local: {os.path.abspath(pdf_path)}")
            print(f"    S3: {upload_result['url']}")
            print(f"    Presigned URL: {s3_url}")
        else:
            print(f"\n[+] Report available locally (S3 upload failed):")
            print(f"    {os.path.abspath(pdf_path)}")
        
        # Prepare analysis data for Polygon submission
        analysis_data = {
            'raw_score': raw,
            'normalized_score': normalized,
            'vulnerability_count': len(issues),
            'threat_level': threat_level
        }
        
        # Submit to Polygon Amoy (optional - only if environment is configured)
        print(f"\n[+] Checking Polygon Amoy configuration...")
        polygon_result = submit_to_polygon_amoy(analysis_data, s3_url)
        
        if polygon_result and polygon_result.get('success'):
            print(f"\n[+] 🎉 Analysis recorded on Polygon Amoy!")
            print(f"    Transaction: {polygon_result['explorer_url']}")
        elif polygon_result and polygon_result.get('status') == 'timeout':
            print(f"\n[+] ⏰ Transaction submitted but timed out. Check manually:")
            print(f"    Transaction: {polygon_result['explorer_url']}")
        else:
            print(f"\n[+] ⚠️ Polygon Amoy submission skipped or failed")
            print(f"    (Check your .env configuration for Polygon variables)")

        # Clean up the generated PDF file
        os.remove(pdf_path)
        
        # Final summary
        print(f"\n" + "="*80)
        print(f"[+] 🎯 HEXSENTINEL ANALYSIS COMPLETE")
        print(f"    Raw Threat Score: {raw}")
        print(f"    Normalized Score: {normalized}/500")
        print(f"    Threat Level: {threat_level}")
        print(f"    Vulnerabilities Found: {len(issues)}")
        if upload_result:
            print(f"    Report URL: {upload_result['presigned_url']}")
        if polygon_result and polygon_result.get('success'):
            print(f"    Blockchain Record: {polygon_result['explorer_url']}")
        print(f"="*80)
        analysis_data = {
            'raw_score': raw,
            'normalized_score': normalized,
            'vulnerability_count': len(issues),
            'threat_level': threat_level,
            's3_url': s3_url,
            'polygon_result': polygon_result
        }
        submit_to_polygon_amoy(analysis_data, s3_url)

    else:
        print("[-] Failed to generate PDF report")


if __name__ == "__main__":
    main()
