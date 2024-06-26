import { Address, Cell, Dictionary } from '@ton/core';
import { airdropEntryValue } from '../wrappers/Airdrop';
import { NetworkProvider, compile } from '@ton/blueprint';
import { AirdropHelper } from '../wrappers/AirdropHelper';

export async function run(provider: NetworkProvider) {
    // suppose that you have the cell in base64 form stored somewhere
    const dictCell = Cell.fromBase64(
        'te6cckEBAgEALgACA8/4AQEASyAHLkMRe87zjfOCuXim8pZoybtV9so0/HgwrX66PnyJKomB6EhAjSZcIw=='
    ); // наш top hash
    const dict = dictCell.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), airdropEntryValue); // достаем словарь участвующих

    const entryIndex = 0n; // индекс в словаре для клейма( автоматизируется для каждого в фронте, чтобы у каждого при нажатии был индекс с его адрессом)

    const proof = dict.generateMerkleProof(entryIndex); // генерируем merkle proof для индекса в списке участвующих()

    const helper = provider.open( // проверка( подробно AirdropHelper.ts)
        AirdropHelper.createFromConfig(
            {
                airdrop: Address.parse('kQBQMN3mMcLkexlPHR2any39bCXtSRbwRzsXqjYKVru0-UOZ'), // адрес задеплоенного контракта аирдропа
                index: entryIndex,
                proofHash: proof.hash(),
            },
            await compile('AirdropHelper')
        )
    );

    if (!(await provider.isContractDeployed(helper.address))) {
        await helper.sendDeploy(provider.sender());
        await provider.waitForDeploy(helper.address);
    }

    await helper.sendClaim(123n, proof); // 123 -> any query_id // функция клейма , принимающая query_id(любой) и merkle_proof (Подробно AirdropHelper.ts)
}
