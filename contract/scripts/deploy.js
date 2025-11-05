const hre = require("hardhat");

async function main() {
  console.log("Deploying ArcClot contract to Arc Testnet...");
  
  // Get the contract factory
  const ArcClot = await hre.ethers.getContractFactory("ArcClot");
  
  // Deploy the contract
  const arcClot = await ArcClot.deploy();
  
  await arcClot.deployed();
  
  console.log("ArcClot deployed to:", arcClot.address);
  console.log("Minimum bet:", "0.5 USDC (500000 units with 6 decimals)");
  console.log("Network: Arc Testnet (Chain ID: 5042002)");
  console.log("Native Currency: USDC (6 decimals)");
  
  // Verify contract on explorer (if verification is available)
  if (hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await arcLot.deployTransaction.wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: arcClot.address,
        constructorArguments: [],
      });
    } catch (e) {
      console.log("Verification failed:", e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });