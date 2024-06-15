import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, toNano } from '@ton/core';
import { AirdropEntry } from './Airdrop';

export type AirdropHelperConfig = {  // наш конфиг 
    airdrop: Address; // адрес задеплоеного контракта аирдропа
    proofHash: Buffer; // пруф
    index: bigint; // индекс
};

export function airdropHelperConfigToCell(config: AirdropHelperConfig): Cell { // формируем ячейку(Cell) из конфига
    return beginCell()
        .storeBit(false)
        .storeAddress(config.airdrop)
        .storeBuffer(config.proofHash, 32)
        .storeUint(config.index, 256)
        .endCell();
}

export class AirdropHelper implements Contract { // наш класс с функциями
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new AirdropHelper(address);
    }

    static createFromConfig(config: AirdropHelperConfig, code: Cell, workchain = 0) {
        const data = airdropHelperConfigToCell(config);
        const init = { code, data };
        return new AirdropHelper(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender) { // деплой контракта клейма
        await provider.internal(via, {
            value: toNano('0.15'), // сколько будет передано на контракт клейма( Не рекомендую менять)
        });
    }

    async sendClaim(provider: ContractProvider, queryId: bigint, proof: Cell) {
        await provider.external(beginCell().storeUint(queryId, 64).storeRef(proof).endCell());
    } // клейм, тут же проверка merkle proof

    async getClaimed(provider: ContractProvider): Promise<boolean> {
        if ((await provider.getState()).state.type == 'uninit') {
            return false;
        }
        const stack = (await provider.get('get_claimed', [])).stack;
        return stack.readBoolean(); // гет метод показывающий клеймил ли пользователь жетоны, позволит избежать множественного клейма
    }
}
