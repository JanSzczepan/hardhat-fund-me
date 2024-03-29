// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {

    function getPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        (, int price, , ,) = priceFeed.latestRoundData();

        return uint256(price * 1e10);
    }

    // function getVersion(AggregatorV3Interface priceFeed) internal view returns (uint256) {
    //     return priceFeed.version();
    // }

    function getConversionRate(uint ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUSD = (ethAmount * ethPrice) / 1e18;

        return ethAmountInUSD;
    }
}
