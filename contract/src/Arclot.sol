// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract ArcClot {
    address public owner;
    uint256 public minBet = 500000; // Minimum bet amount: 0.5 USDC (6 decimals)

    struct PlayerStats {
        uint256 totalSpins;
        uint256 totalWins;
        uint256 totalPayout;
        uint8[3] lastResult;
        uint256 lastPayout;
        uint256 totalBetAmount;
    }

    struct LeaderboardEntry {
        address player;
        uint256 earnings;
    }

    mapping(address => PlayerStats) public playerStats;
    mapping(address => uint256) public playerEarnings; // Net earnings (payout - bet)
    address[] public topPlayers; // Top 100 players by earnings
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;

    event Spin(address indexed player, uint8[3] result, uint256 bet, uint256 payout);
    event LeaderboardUpdated(address indexed player, uint256 earnings, uint256 rank);

    constructor() {
        owner = msg.sender;
    }

    function spin() external payable {
        require(msg.value >= minBet, "Bet must be >= 0.5 USDC");

        // Simple pseudo-random generator (for demo only)
        uint256 random = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))
        );

        uint8[3] memory reels;
        for (uint8 i = 0; i < 3; i++) {
            reels[i] = uint8(random % 7); // 7 symbols (0–6)
            random /= 7;
        }

        uint256 payout = calculatePayout(reels, msg.value);

        // Update on-chain player stats
        PlayerStats storage stats = playerStats[msg.sender];
        stats.totalSpins += 1;
        stats.totalBetAmount += msg.value;
        stats.lastResult = reels;
        stats.lastPayout = payout;

        if (payout > 0) {
            stats.totalWins += 1;
            stats.totalPayout += payout;

            require(address(this).balance >= payout, "Not enough funds");
            payable(msg.sender).transfer(payout);
        }

        // Update player earnings (net profit/loss)
        int256 netChange = int256(payout) - int256(msg.value);
        if (netChange > 0) {
            playerEarnings[msg.sender] += uint256(netChange);
        } else if (netChange < 0 && playerEarnings[msg.sender] >= uint256(-netChange)) {
            playerEarnings[msg.sender] -= uint256(-netChange);
        } else if (netChange < 0) {
            playerEarnings[msg.sender] = 0;
        }

        // Update leaderboard
        _updateLeaderboard(msg.sender);

        emit Spin(msg.sender, reels, msg.value, payout);
    }

    function calculatePayout(uint8[3] memory reels, uint256 bet) internal pure returns (uint256) {
        // 3 of a kind = 5x
        if (reels[0] == reels[1] && reels[1] == reels[2]) {
            return bet * 5;
        }
        // 2 of a kind = 2x
        else if (
            reels[0] == reels[1] || reels[1] == reels[2] || reels[0] == reels[2]
        ) {
            return bet * 2;
        }
        // no match
        return 0;
    }

    // ===== Owner Functions =====
    function setMinBet(uint256 _minBet) external {
        require(msg.sender == owner, "Not owner");
        minBet = _minBet;
    }

    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(amount);
    }

    // Fund the game with USDC
    receive() external payable {}

    // ===== Leaderboard Functions =====
    function _updateLeaderboard(address player) internal {
        uint256 earnings = playerEarnings[player];
        
        // Check if player is already in leaderboard
        int256 currentIndex = -1;
        for (uint256 i = 0; i < topPlayers.length; i++) {
            if (topPlayers[i] == player) {
                currentIndex = int256(i);
                break;
            }
        }

        // If player not in leaderboard and has earnings, try to add
        if (currentIndex == -1) {
            if (topPlayers.length < MAX_LEADERBOARD_SIZE) {
                // Add player if there's space
                topPlayers.push(player);
                currentIndex = int256(topPlayers.length - 1);
            } else if (earnings > playerEarnings[topPlayers[MAX_LEADERBOARD_SIZE - 1]]) {
                // Replace last player if new player has higher earnings
                topPlayers[MAX_LEADERBOARD_SIZE - 1] = player;
                currentIndex = int256(MAX_LEADERBOARD_SIZE - 1);
            } else {
                return; // Player doesn't qualify for leaderboard
            }
        }

        // Bubble up the player to correct position
        uint256 idx = uint256(currentIndex);
        while (idx > 0 && playerEarnings[topPlayers[idx]] > playerEarnings[topPlayers[idx - 1]]) {
            address temp = topPlayers[idx];
            topPlayers[idx] = topPlayers[idx - 1];
            topPlayers[idx - 1] = temp;
            idx--;
        }

        emit LeaderboardUpdated(player, earnings, idx + 1);
    }

    function getLeaderboard() external view returns (LeaderboardEntry[] memory) {
        uint256 length = topPlayers.length;
        LeaderboardEntry[] memory leaderboard = new LeaderboardEntry[](length);
        
        for (uint256 i = 0; i < length; i++) {
            leaderboard[i] = LeaderboardEntry({
                player: topPlayers[i],
                earnings: playerEarnings[topPlayers[i]]
            });
        }
        
        return leaderboard;
    }

    function getTopPlayers(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 length = count > topPlayers.length ? topPlayers.length : count;
        address[] memory players = new address[](length);
        uint256[] memory earnings = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            players[i] = topPlayers[i];
            earnings[i] = playerEarnings[topPlayers[i]];
        }
        
        return (players, earnings);
    }

    function getPlayerRank(address player) external view returns (uint256) {
        for (uint256 i = 0; i < topPlayers.length; i++) {
            if (topPlayers[i] == player) {
                return i + 1; // Rank starts from 1
            }
        }
        return 0; // Not in leaderboard
    }

    function getLeaderboardSize() external view returns (uint256) {
        return topPlayers.length;
    }
}