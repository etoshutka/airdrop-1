import {
    Dictionary,
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Builder,
    Slice,
} from '@ton/core';

export type TONAirdropConfig = { // формируем тип
    merkleRoot: bigint;
    helperCode: Cell;
};

export function TONairdropConfigToCell(config: TONAirdropConfig): Cell { // собираем предыдущий тип в ячейку
    return beginCell()
        .storeUint(0, 2)
        .storeUint(config.merkleRoot, 256)
        .storeRef(config.helperCode)
        .storeUint(Math.floor(Math.random() * 1e9), 64)
        .endCell();
}

export type TONAirdropEntry = { // тип для словаряx(списка) участвующих
    address: Address;
    amount: bigint;
};

export const TONairdropEntryValue = { // для словаря
    serialize: (src: TONAirdropEntry, buidler: Builder) => {
        buidler.storeAddress(src.address).storeCoins(src.amount);
    },
    parse: (src: Slice) => {
        return {
            address: src.loadAddress(),
            amount: src.loadCoins(),
        };
    },
};

export function TONgenerateEntriesDictionary(entries: TONAirdropEntry[]): Dictionary<bigint, TONAirdropEntry> { // генерируем список участвуюзих(индекс с типом Bigint, константа airdropEntryValue )
    let dict: Dictionary<bigint, TONAirdropEntry> = Dictionary.empty(Dictionary.Keys.BigUint(256), TONairdropEntryValue);

    for (let i = 0; i < entries.length; i++) {
        dict.set(BigInt(i), entries[i]);
    }

    return dict;
}

export class TONAirdrop implements Contract { // наш класс с функциями( здесь только деплой)
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new TONAirdrop(address);
    }

    static createFromConfig(config: TONAirdropConfig, code: Cell, workchain = 0) {
        const data = TONairdropConfigToCell(config);
        const init = { code, data };
        return new TONAirdrop(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0x43c7d5c2, 32).storeUint(1, 64).endCell(), // деплоим, в ячейке сохраняем op code деплоя, query_id(любой) , адрес мастер-кошелька жетона который планируем раздавать
        });
    }
}
