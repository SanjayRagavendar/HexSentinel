import React from 'react';
import { AlertTriangle, Code, Shield, Zap, Lock, DollarSign } from 'lucide-react';

const Vulnerabilities = () => {
  const vulnerabilities = [
    {
      icon: Zap,
      title: "Reentrancy Attacks",
      description: "Malicious contracts call back into the victim contract before state changes are finalized",
      severity: "Critical",
      color: "red",
      example: `function withdraw() public {
  uint amount = balances[msg.sender];
  require(amount > 0);
  // Vulnerability: External call before state update
  (bool success,) = msg.sender.call{value: amount}("");
  require(success);
  balances[msg.sender] = 0; // Too late!
}`
    },
    {
      icon: DollarSign,
      title: "Selfdestruct Abuse",
      description: "Contracts using selfdestruct can be exploited to force ether transfers",
      severity: "High",
      color: "orange",
      example: `contract Victim {
  mapping(address => uint) balances;
  
  function deposit() payable {
    balances[msg.sender] += msg.value;
  }
  
  // Vulnerability: Contract balance manipulation
  function getBalance() view returns (uint) {
    return address(this).balance;
  }
}`
    },
    {
      icon: Lock,
      title: "Access Control Flaws",
      description: "Missing or incorrect access modifiers allow unauthorized function calls",
      severity: "High",
      color: "orange",
      example: `contract Token {
  address owner;
  mapping(address => uint) balances;
  
  // Vulnerability: Missing access control
  function mint(address to, uint amount) public {
    balances[to] += amount;
  }
}`
    },
    {
      icon: AlertTriangle,
      title: "Integer Overflow/Underflow",
      description: "Arithmetic operations can wrap around causing unexpected behavior",
      severity: "Medium",
      color: "yellow",
      example: `function transfer(address to, uint amount) public {
  // Vulnerability: No overflow check
  require(balances[msg.sender] >= amount);
  balances[msg.sender] -= amount;
  balances[to] += amount; // Can overflow
}`
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'High': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Vulnerability Detection</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Understanding common smart contract vulnerabilities and how HexSentinel detects them
          </p>
        </div>

        {/* Vulnerability Cards */}
        <div className="space-y-8 mb-12">
          {vulnerabilities.map((vuln, index) => {
            const Icon = vuln.icon;
            return (
              <div key={index} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start space-x-6 mb-6">
                    <div className={`w-12 h-12 bg-${vuln.color}-400/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 text-${vuln.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-xl font-semibold text-white">{vuln.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity}
                        </span>
                      </div>
                      <p className="text-gray-400">{vuln.description}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3 flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      Vulnerable Code Example
                    </h4>
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      <code>{vuln.example}</code>
                    </pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Honeypot Logic */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
          <div className="flex items-start space-x-6">
            <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-4">Honeypot Detection Logic</h3>
              <p className="text-gray-400 mb-6">
                Our honeypot contracts are designed to attract malicious actors by appearing vulnerable 
                while secretly monitoring and logging all interaction attempts.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h4 className="text-white font-medium mb-4">Bait Mechanisms</h4>
                  <ul className="text-gray-400 space-y-2">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Apparent reentrancy vulnerabilities with hidden state tracking</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Fake access control flaws with interaction logging</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Tempting balance manipulations with trap detection</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h4 className="text-white font-medium mb-4">Detection Triggers</h4>
                  <ul className="text-gray-400 space-y-2">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Unusual gas patterns indicating exploitation attempts</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Multiple failed transaction attempts with increasing gas</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Contract creation from suspicious addresses</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-mono text-sm mb-2">Honeypot Contract Snippet:</h4>
                <pre className="text-gray-300 text-sm overflow-x-auto">
                  <code>{`contract HoneyPot {
  event AttackAttempt(address attacker, bytes data, uint gasUsed);
  
  mapping(address => uint) public balances;
  address private monitor;
  
  modifier logInteraction() {
    uint gasStart = gasleft();
    _;
    emit AttackAttempt(msg.sender, msg.data, gasStart - gasleft());
  }
  
  function withdraw() public logInteraction {
    // Appears vulnerable but logs all attempts
    uint amount = balances[msg.sender];
    (bool success,) = msg.sender.call{value: amount}("");
    if (success) balances[msg.sender] = 0;
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vulnerabilities;
