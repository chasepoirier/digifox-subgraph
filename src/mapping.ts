import { PairCreated } from "../generated/templates/Token/Factory";
import { Token as TokenTemplate } from "../generated/templates";
import { Token, TokenBalance } from "../generated/schema";
import {
  DataSourceContext,
  ethereum,
  dataSource,
  log,
  Address,
  BigInt,
} from "@graphprotocol/graph-ts";
import {
  createWallet,
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "./helpers";
import { ERC20, Transfer } from "../generated/Block/ERC20";

function handleUpdateReceiver(
  walletAddress: Address,
  tokenAddress: Address,
  amount: BigInt
): void {
  let ID = walletAddress
    .toHexString()
    .concat("-")
    .concat(tokenAddress.toHexString());

  let token = TokenBalance.load(ID);

  if (token === null) {
    token = new TokenBalance(ID);
    token.balance = new BigInt(0);
  }

  token.balance = token.balance.plus(amount);
  token.token = tokenAddress.toHexString();
  token.wallet = walletAddress.toHexString();

  token.save();
}

function handleUpdateSender(
  walletAddress: Address,
  tokenAddress: Address,
  amount: BigInt
): void {
  let ID = walletAddress
    .toHexString()
    .concat("-")
    .concat(tokenAddress.toHexString());

  let token = TokenBalance.load(ID);

  if (token === null) {
    token = new TokenBalance(ID);
    token.balance = new BigInt(0);
  }

  token.balance = token.balance.minus(amount);
  token.token = tokenAddress.toHexString();
  token.wallet = walletAddress.toHexString();

  token.save();
}

export function handleTransfer(event: Transfer): void {
  // let contract = ERC20.bind(event.address);

  createWallet(event.params.to);
  createWallet(event.params.from);

  log.info("AMOUNT" + event.params.value.toString(), []);
  handleUpdateSender(event.params.from, event.address, event.params.value);
  handleUpdateReceiver(event.params.to, event.address, event.params.value);
  // addToken(event.params.to, Address.fromString(contractAddress.toHexString()));
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
    context.setBytes("contractAddress", event.params.token1);
    TokenTemplate.createWithContext(event.params.token1, context);
  }

  // save updated values
  token0.save();
  token1.save();
}
