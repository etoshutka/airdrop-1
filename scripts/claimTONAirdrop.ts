import { Address, Cell, Dictionary } from '@ton/core';
import { NetworkProvider, compile } from '@ton/blueprint';
import { AirdropHelper } from '../wrappers/TONAirdrophelper';
import { TONairdropEntryValue } from '../wrappers/TONAirdrop';

export async function run(provider: NetworkProvider) {
    // suppose that you have the cell in base64 form stored somewhere
    const dictCell = Cell.fromBase64(
        'te6cckEBBAEAWwACA8/oAgEAS0gBy5DEXvO843zgrl4pvKWaMm7VfbKNPx4MK1+uj58iSqJgehIQAgEgAwMASyAHLkMRe87zjfOCuXim8pZoybtV9so0/HgwrX66PnyJKomB6EhAE/xcmA=='
    ); // наш top hash
    const dict = dictCell.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), TONairdropEntryValue); // достаем словарь участвующих

    const entryIndex = 0n; // индекс в словаре для клейма( автоматизируется для каждого в фронте, чтобы у каждого при нажатии был индекс с его адрессом)

    const proof = dict.generateMerkleProof(entryIndex); // генерируем merkle proof для индекса в списке участвующих()

    const helper = provider.open( // проверка( подробно AirdropHelper.ts)
        AirdropHelper.createFromConfig(
            {
                airdrop: Address.parse('kQC9EY6Sz5FkYc5lAdQyf7N_kj-wTjjBKfA4_k2BWKZPcqNp'), // адрес задеплоенного контракта аирдропа
                index: entryIndex,
                proofHash: proof.hash(),
            },
            await compile('TONAirdrophelper')
        )
    );

    if (!(await provider.isContractDeployed(helper.address))) {
        await helper.sendDeploy(provider.sender());
        await provider.waitForDeploy(helper.address);
    }

    await helper.sendClaim(123n, proof); // 123 -> any query_id // функция клейма , принимающая query_id(любой) и merkle_proof (Подробно AirdropHelper.ts)
}
