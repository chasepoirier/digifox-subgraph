import { PairCreated } from "../generated/templates/Token/Factory";
import { Token as TokenTemplate } from "../generated/templates";
import { Token } from "../generated/schema";
import {
  DataSourceContext,
  ethereum,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import {
  addToken,
  createWallet,
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "./helpers";
import { Transfer } from "../generated/Block/ERC20";

export function handleTransfer(event: Transfer): void {
  // log.info("CONTRACT_ADDRESS", [contractAddress]);

  let context = dataSource.context();
  let contractAddress = context.getString("contractAddress");

  // log.info("RECEIVER", [event.params.to.toHexString()]);

  createWallet(event.params.to);

  addToken(event.params.to, contractAddress);
  // log.info("RECEIVER", [event.params.to.toHexString()]);
  // log.info("CONTRACT_ADDRESS", [contractAddress.toHexString()]);
}

export function handleNewPair(event: PairCreated): void {
  let token0 = Token.load(event.params.token0.toHexString());
  let token1 = Token.load(event.params.token1.toHexString());

  // fetch info if null
  if (token0 == null) {
    token0 = new Token(event.params.token0.toHexString());
    token0.symbol = fetchTokenSymbol(event.params.token0);
    token0.name = fetchTokenName(event.params.token0);

    let decimals = fetchTokenDecimals(event.params.token0);
    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug("mybug the decimal on token 0 was null", []);
      return;
    }

    token0.decimals = decimals;

    let context = new DataSourceContext();
    context.setBytes("contractAddress", event.params.token0);
    TokenTemplate.createWithContext(event.params.token0, context);
  }

  if (token1 == null) {
    token1 = new Token(event.params.token1.toHexString());
    token1.symbol = fetchTokenSymbol(event.params.token1);
    token1.name = fetchTokenName(event.params.token1);

    let decimals = fetchTokenDecimals(event.params.token1);
    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug("mybug the decimal on token 1 was null", []);
      return;
    }

    token1.decimals = decimals;

    let context = new DataSourceContext();
    context.setString("contractAddress", event.params.token1.toHexString());
    TokenTemplate.createWithContext(event.params.token1, context);
  }

  // save updated values
  token0.save();
  token1.save();
}
