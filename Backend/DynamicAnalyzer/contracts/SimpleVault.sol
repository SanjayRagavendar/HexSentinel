// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleVault
 * @dev A simple vault contract for threat analysis testing
 * Contains functions that can revert, use varying gas, and make external calls
 */
contract SimpleVault {
    mapping(address => uint256) public balances;
    mapping(address => bool) public isBlacklisted;
    uint256 public totalDeposits;
    uint256 public constant MAX_DEPOSIT = 1000 ether;
    uint256 public constant MIN_DEPOSIT = 0.1 ether;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Blacklisted(address indexed user);
    
    error InsufficientBalance();
    error BlacklistedUser();
    error InvalidAmount();
    error MaxDepositExceeded();
    
    /**
     * @dev Deposit function that can revert under certain conditions
     */
    function deposit() external payable {
        if (isBlacklisted[msg.sender]) {
            revert BlacklistedUser();
        }
        
        if (msg.value < MIN_DEPOSIT) {
            revert InvalidAmount();
        }
        
        if (msg.value > MAX_DEPOSIT) {
            revert MaxDepositExceeded();
        }
        
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw function that can revert
     */
    function withdraw(uint256 amount) external {
        if (balances[msg.sender] < amount) {
            revert InsufficientBalance();
        }
        
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdraw(msg.sender, amount);
    }
    
    /**
     * @dev Function that uses varying amounts of gas based on input
     */
    function store(uint256 value) external {
        // Gas usage varies with the value
        for (uint256 i = 0; i < value % 10; i++) {
            balances[msg.sender] = value + i;
        }
    }
    
    /**
     * @dev Function that can revert randomly (for testing)
     */
    function riskyFunction(uint256 seed) external pure returns (uint256) {
        // Simulate random reverts for testing
        if (seed % 5 == 0) {
            revert("Random revert");
        }
        return seed * 2;
    }
    
    /**
     * @dev Function that makes external calls
     */
    function externalCall(address target, bytes calldata data) external returns (bytes memory) {
        (bool success, bytes memory result) = target.call(data);
        require(success, "External call failed");
        return result;
    }
    
    /**
     * @dev Get balance for an address
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    /**
     * @dev Blacklist a user (admin function)
     */
    function blacklistUser(address user) external {
        isBlacklisted[user] = true;
        emit Blacklisted(user);
    }
} 