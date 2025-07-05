import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import uuid
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

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

def extract_detailed_vulnerabilities(slither_json):
    """Extract comprehensive vulnerability details directly from Slither JSON."""
    vulnerabilities = []
    
    for detector in slither_json.get("results", {}).get("detectors", []):
        vuln = {
            "check_id": detector.get("check"),
            "impact": detector.get("impact", "Low"),
            "confidence": detector.get("confidence", "Low"),
            "description": detector.get("description", ""),
            "markdown": detector.get("markdown", ""),
            "detector_id": detector.get("id", ""),
            "functions_affected": [],
            "contracts_affected": [],
            "code_locations": [],
            "external_calls": [],
            "state_variables_modified": [],
            "cross_function_reentrancy": []
        }
        
        # Extract detailed information from elements
        for element in detector.get("elements", []):
            element_type = element.get("type")
            
            if element_type == "function":
                func_info = {
                    "name": element.get("name"),
                    "signature": element.get("type_specific_fields", {}).get("signature", ""),
                    "file": element.get("source_mapping", {}).get("filename_short", ""),
                    "lines": element.get("source_mapping", {}).get("lines", []),
                    "contract": element.get("type_specific_fields", {}).get("parent", {}).get("name", "")
                }
                vuln["functions_affected"].append(func_info)
                
            elif element_type == "contract":
                contract_info = {
                    "name": element.get("name"),
                    "file": element.get("source_mapping", {}).get("filename_short", ""),
                    "lines": element.get("source_mapping", {}).get("lines", [])
                }
                vuln["contracts_affected"].append(contract_info)
                
            elif element_type == "node":
                node_info = {
                    "code": element.get("name", ""),
                    "file": element.get("source_mapping", {}).get("filename_short", ""),
                    "lines": element.get("source_mapping", {}).get("lines", []),
                    "underlying_type": element.get("additional_fields", {}).get("underlying_type", "")
                }
                
                # Categorize nodes by type
                if node_info["underlying_type"] == "external_calls":
                    vuln["external_calls"].append(node_info)
                elif node_info["underlying_type"] == "variables_written":
                    variable_name = element.get("additional_fields", {}).get("variable_name", "")
                    node_info["variable_name"] = variable_name
                    vuln["state_variables_modified"].append(node_info)
                
                vuln["code_locations"].append(node_info)
        
        # Calculate threat score for this vulnerability
        base_severity = BASE_SEVERITY_WEIGHTS.get(vuln["impact"], 1.0)
        confidence_multiplier = CONFIDENCE_MULTIPLIERS.get(vuln["confidence"], 1.0)
        dynamic_weight = base_severity * confidence_multiplier
        
        if vuln["impact"] in ["High", "Medium"]:
            prevalence = 3
            exploitability = 3
        else:
            prevalence = DEFAULT_PREVALENCE
            exploitability = DEFAULT_EXPLOITABILITY
            
        vuln["threat_score"] = round(dynamic_weight * prevalence * exploitability, 2)
        vuln["base_severity"] = base_severity
        vuln["confidence_multiplier"] = confidence_multiplier
        vuln["dynamic_weight"] = round(dynamic_weight, 2)
        
        vulnerabilities.append(vuln)
    
    return vulnerabilities

def analyze_vulnerability_details(vuln):
    """Analyze vulnerability based on extracted JSON data."""
    analysis = {
        "severity_explanation": "",
        "technical_analysis": "",
        "code_analysis": "",
        "attack_scenario": "",
        "remediation": ""
    }
    
    # Parse the description to understand the vulnerability
    description = vuln["description"]
    
    if vuln["check_id"] == "reentrancy-eth":
        analysis["severity_explanation"] = f"This vulnerability is classified as {vuln['impact']} impact with {vuln['confidence']} confidence because it allows recursive calls that can drain contract funds."
        
        # Extract specific details from description
        analysis["technical_analysis"] = f"""
REENTRANCY VULNERABILITY ANALYSIS:
{description}

VULNERABILITY PATTERN IDENTIFIED:
- Function: {vuln['functions_affected'][0]['name'] if vuln['functions_affected'] else 'Unknown'}()
- External calls made before state updates
- State variables written after external calls
- This creates a window for recursive attacks
"""
        
        # Analyze code locations
        external_call_lines = [loc for loc in vuln["code_locations"] if loc["underlying_type"] == "external_calls"]
        state_var_lines = [loc for loc in vuln["code_locations"] if loc["underlying_type"] == "variables_written"]
        
        analysis["code_analysis"] = "PROBLEMATIC CODE SEQUENCE:\n"
        for call in external_call_lines:
            lines = call["lines"]
            line_str = f"line {lines[0]}" if lines else "unknown line"
            analysis["code_analysis"] += f"1. External call on {line_str}: {call['code']}\n"
            
        for var in state_var_lines:
            lines = var["lines"] 
            line_str = f"line {lines[0]}" if lines else "unknown line"
            analysis["code_analysis"] += f"2. State update on {line_str}: {var['code']}\n"
            
        analysis["code_analysis"] += "\nThe state update happens AFTER the external call, creating reentrancy vulnerability."
        
        analysis["attack_scenario"] = """
ATTACK SCENARIO:
1. Attacker deploys malicious contract with fallback function
2. Attacker calls claimRewards() with legitimate stake
3. Contract calculates reward and makes external call
4. Attacker's fallback function calls claimRewards() again
5. Since state hasn't been updated, reward is calculated again
6. Process repeats until contract balance is drained
"""
        
        analysis["remediation"] = """
IMMEDIATE FIXES REQUIRED:
1. Move state updates BEFORE external calls (Checks-Effects-Interactions pattern)
2. Add reentrancy guard using OpenZeppelin's ReentrancyGuard
3. Use pull payment pattern instead of push payments
4. Consider using transfer() instead of call() for simple Ether transfers
"""

    elif vuln["check_id"] == "solc-version":
        analysis["severity_explanation"] = f"Classified as {vuln['impact']} because it affects code reliability but doesn't directly create exploitable vulnerabilities."
        analysis["technical_analysis"] = f"COMPILER ISSUE ANALYSIS:\n{description}"
        analysis["code_analysis"] = "The pragma directive allows problematic compiler versions that contain known bugs."
        analysis["attack_scenario"] = "Not directly exploitable, but compiler bugs may create unexpected behavior that could be exploited."
        analysis["remediation"] = "Upgrade to Solidity 0.8.21+ and pin to specific version without caret (^)."
        
    elif vuln["check_id"] == "low-level-calls":
        analysis["severity_explanation"] = f"Classified as {vuln['impact']} - not directly exploitable but enables other vulnerabilities."
        analysis["technical_analysis"] = f"LOW-LEVEL CALL ANALYSIS:\n{description}"
        
        # Find the specific call
        call_code = ""
        for call in vuln["external_calls"]:
            call_code = call["code"]
            break
            
        analysis["code_analysis"] = f"Low-level call identified: {call_code}\nThis bypasses Solidity safety checks and enables reentrancy."
        analysis["attack_scenario"] = "Enables reentrancy attacks by allowing unlimited gas forwarding to external contracts."
        analysis["remediation"] = "Use transfer() for simple Ether transfers or implement proper gas limits and reentrancy protection."
    
    else:
        # Generic analysis for unknown vulnerability types
        analysis["severity_explanation"] = f"Impact: {vuln['impact']}, Confidence: {vuln['confidence']}"
        analysis["technical_analysis"] = description
        analysis["code_analysis"] = "Specific code analysis not available."
        analysis["attack_scenario"] = "Attack scenario analysis not available."
        analysis["remediation"] = "Consult Slither documentation for remediation steps."
    
    return analysis

def generate_comprehensive_pdf_report(vulnerabilities, output_filename="HexSentinel_Security_Report.pdf"):
    """Generate detailed PDF security report."""
    
    doc = SimpleDocTemplate(output_filename, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'HexSentinelTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.darkblue,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.darkgreen,
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.darkred,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    subheading_style = ParagraphStyle(
        'SubHeading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.darkblue,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    
    # Header
    story.append(Paragraph("🛡️ HexSentinel", title_style))
    story.append(Paragraph("Smart Contract Security Analysis Report", subtitle_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Calculate overall threat metrics
    total_score = sum(vuln["threat_score"] for vuln in vulnerabilities)
    normalized_score = min((total_score / 300.0) * 500, 500)
    
    if normalized_score >= 400:
        threat_level = "🔥 CRITICAL"
        threat_color = colors.red
    elif normalized_score >= 300:
        threat_level = "⚠️ HIGH" 
        threat_color = colors.orange
    elif normalized_score >= 150:
        threat_level = "⚙️ MODERATE"
        threat_color = colors.yellow
    else:
        threat_level = "🧩 LOW"
        threat_color = colors.green
    
    # Executive Summary
    story.append(Paragraph("📋 EXECUTIVE SUMMARY", heading_style))
    
    # Summary table
    summary_data = [
        ["Report Generated", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
        ["Analysis Target", "YieldFarmVault Smart Contract"],
        ["Vulnerabilities Found", str(len(vulnerabilities))],
        ["Raw Threat Score", f"{total_score:.2f} points"],
        ["Normalized Score", f"{normalized_score:.2f}/500"],
        ["Overall Threat Level", threat_level]
    ]
    
    summary_table = Table(summary_data, colWidths=[2.5*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 10)
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 0.4*inch))
    
    # Vulnerability breakdown
    vuln_summary_data = [["Vulnerability Type", "Impact", "Confidence", "Threat Score"]]
    for vuln in vulnerabilities:
        vuln_summary_data.append([
            vuln["check_id"], 
            vuln["impact"], 
            vuln["confidence"], 
            f"{vuln['threat_score']:.2f}"
        ])
    
    vuln_summary_table = Table(vuln_summary_data, colWidths=[2*inch, 1*inch, 1*inch, 1.5*inch])
    vuln_summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 9)
    ]))
    
    story.append(vuln_summary_table)
    story.append(PageBreak())
    
    # Detailed Vulnerability Analysis
    story.append(Paragraph("🔍 DETAILED VULNERABILITY ANALYSIS", heading_style))
    
    for i, vuln in enumerate(vulnerabilities, 1):
        analysis = analyze_vulnerability_details(vuln)
        
        story.append(Paragraph(f"VULNERABILITY #{i}: {vuln['check_id'].upper().replace('-', ' ')}", subheading_style))
        
        # Vulnerability metadata
        metadata_data = [
            ["Detector ID", vuln["check_id"]],
            ["Impact Level", vuln["impact"]],
            ["Confidence Level", vuln["confidence"]],
            ["Threat Score", f"{vuln['threat_score']:.2f} points"],
            ["Scoring Breakdown", f"{vuln['base_severity']} × {vuln['confidence_multiplier']} × 9 = {vuln['threat_score']:.2f}"]
        ]
        
        if vuln["functions_affected"]:
            func = vuln["functions_affected"][0]
            metadata_data.extend([
                ["Affected Contract", func["contract"]],
                ["Affected Function", f"{func['name']}()"],
                ["File Location", func["file"]],
                ["Line Numbers", f"Lines {min(func['lines'])}-{max(func['lines'])}" if func["lines"] else "N/A"]
            ])
        
        metadata_table = Table(metadata_data, colWidths=[1.8*inch, 3.7*inch])
        metadata_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightsteelblue),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        
        story.append(metadata_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Detailed analysis sections
        story.append(Paragraph("🎯 Severity Explanation:", ParagraphStyle('BoldLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11)))
        story.append(Paragraph(analysis["severity_explanation"], styles['Normal']))
        story.append(Spacer(1, 0.15*inch))
        
        story.append(Paragraph("🔬 Technical Analysis:", ParagraphStyle('BoldLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11)))
        story.append(Paragraph(analysis["technical_analysis"].replace('\n', '<br/>'), styles['Normal']))
        story.append(Spacer(1, 0.15*inch))
        
        story.append(Paragraph("💻 Code Analysis:", ParagraphStyle('BoldLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11)))
        story.append(Paragraph(analysis["code_analysis"].replace('\n', '<br/>'), styles['Normal']))
        story.append(Spacer(1, 0.15*inch))
        
        # Code locations
        if vuln["code_locations"]:
            story.append(Paragraph("📍 Affected Code Locations:", ParagraphStyle('BoldLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11)))
            
            code_data = [["Line(s)", "Code", "Type"]]
            for loc in vuln["code_locations"]:
                line_nums = ", ".join(map(str, loc["lines"])) if loc["lines"] else "N/A"
                code_data.append([
                    line_nums,
                    loc["code"][:50] + "..." if len(loc["code"]) > 50 else loc["code"],
                    loc["underlying_type"] or "general"
                ])
            
            code_table = Table(code_data, colWidths=[0.8*inch, 3.2*inch, 1.5*inch])
            code_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP')
            ]))
            
            story.append(code_table)
            story.append(Spacer(1, 0.15*inch))
        
        story.append(Paragraph("💥 Attack Scenario:", ParagraphStyle('BoldLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11)))
        story.append(Paragraph(analysis["attack_scenario"].replace('\n', '<br/>'), styles['Normal']))
        story.append(Spacer(1, 0.15*inch))
        
        story.append(Paragraph("🛠️ Remediation:", ParagraphStyle('BoldLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11)))
        story.append(Paragraph(analysis["remediation"].replace('\n', '<br/>'), styles['Normal']))
        
        story.append(Spacer(1, 0.3*inch))
        story.append(PageBreak())
    
    # Scoring methodology
    story.append(Paragraph("📊 THREAT SCORING METHODOLOGY", heading_style))
    
    methodology_text = f"""
<b>HexSentinel Dynamic Scoring System:</b><br/><br/>
<b>Base Severity Weights:</b><br/>
• High Impact: 40.0 points<br/>
• Medium Impact: 20.0 points<br/>
• Low Impact: 10.0 points<br/>
• Informational: 5.0 points<br/><br/>

<b>Confidence Multipliers:</b><br/>
• High Confidence: 1.0x (no reduction)<br/>
• Medium Confidence: 0.8x<br/>
• Low Confidence: 0.6x<br/><br/>

<b>Risk Amplification:</b><br/>
• High/Medium severity: 3x prevalence × 3x exploitability = 9x multiplier<br/>
• Low/Informational: 2x prevalence × 2x exploitability = 4x multiplier<br/><br/>

<b>Final Calculation:</b><br/>
Score = (Base Severity × Confidence Multiplier) × Risk Amplification<br/><br/>

<b>Your Contract Scores:</b><br/>
"""
    
    for vuln in vulnerabilities:
        methodology_text += f"• {vuln['check_id']}: {vuln['threat_score']:.2f} points ({vuln['impact']}/{vuln['confidence']})<br/>"
    
    methodology_text += f"<br/><b>Total Raw Score:</b> {total_score:.2f} points<br/>"
    methodology_text += f"<b>Normalized Score:</b> {normalized_score:.2f}/500<br/>"
    methodology_text += f"<b>Final Threat Level:</b> {threat_level}"
    
    story.append(Paragraph(methodology_text, styles['Normal']))
    
    # Recommendations
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("🎯 PRIORITIZED RECOMMENDATIONS", heading_style))
    
    # Categorize recommendations by severity
    high_severity_vulns = [v for v in vulnerabilities if v["impact"] == "High"]
    medium_severity_vulns = [v for v in vulnerabilities if v["impact"] == "Medium"]
    low_severity_vulns = [v for v in vulnerabilities if v["impact"] in ["Low", "Informational"]]
    
    recommendations_text = ""
    
    if high_severity_vulns:
        recommendations_text += "<b>🚨 CRITICAL PRIORITY (Immediate Action Required):</b><br/>"
        for vuln in high_severity_vulns:
            recommendations_text += f"• Fix {vuln['check_id']} vulnerability in {vuln['functions_affected'][0]['name'] if vuln['functions_affected'] else 'contract'}()<br/>"
        recommendations_text += "<br/>"
    
    if medium_severity_vulns:
        recommendations_text += "<b>⚠️ HIGH PRIORITY:</b><br/>"
        for vuln in medium_severity_vulns:
            recommendations_text += f"• Address {vuln['check_id']} issue<br/>"
        recommendations_text += "<br/>"
    
    if low_severity_vulns:
        recommendations_text += "<b>ℹ️ MEDIUM PRIORITY (Best Practices):</b><br/>"
        for vuln in low_severity_vulns:
            recommendations_text += f"• Resolve {vuln['check_id']} for improved code quality<br/>"
        recommendations_text += "<br/>"
    
    recommendations_text += """
<b>📋 GENERAL RECOMMENDATIONS:</b><br/>
• Implement comprehensive unit and integration tests<br/>
• Consider professional security audit before mainnet deployment<br/>
• Establish continuous security monitoring<br/>
• Follow secure development best practices<br/>
• Regular dependency and compiler updates<br/>
"""
    
    story.append(Paragraph(recommendations_text, styles['Normal']))
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("📄 Report generated by HexSentinel Static Analysis Tool | Powered by Slither", 
                          ParagraphStyle('Footer', parent=styles['Normal'], 
                                       fontSize=9, textColor=colors.grey, 
                                       alignment=TA_CENTER)))
    
    # Build the PDF
    doc.build(story)
    return output_filename

def main():
    """Generate comprehensive PDF report from existing Slither JSON output."""
    json_file = "slither-output.json"
    
    if not os.path.exists(json_file):
        print(f" Error: {json_file} not found!")
        print("Please run Slither analysis first to generate the JSON file.")
        return
    
    print("📖 Loading Slither analysis results...")
    with open(json_file, 'r') as f:
        slither_data = json.load(f)
    
    print("🔍 Extracting vulnerability details...")
    vulnerabilities = extract_detailed_vulnerabilities(slither_data)
    
    if not vulnerabilities:
        print(" No vulnerabilities found in the analysis.")
        return
    
    print(f" Found {len(vulnerabilities)} vulnerabilities. Generating PDF report...")
    
    output_file = generate_comprehensive_pdf_report(vulnerabilities,output_filename=f"HexSentinel_Security_Report_{uuid.uuid4().hex}.pdf")
    
    print(f" Comprehensive security report generated: {output_file}")
    print(f" Report location: {os.path.abspath(output_file)}")
    return output_file

if __name__ == "__main__":
    main()
