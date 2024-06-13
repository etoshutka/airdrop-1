import { Address, Cell, Dictionary } from '@ton/core';
import { airdropEntryValue } from '../wrappers/Airdrop';
import { NetworkProvider, compile } from '@ton/blueprint';
import { AirdropHelper } from '../wrappers/AirdropHelper';

export async function run(provider: NetworkProvider) {
    // suppose that you have the cell in base64 form stored somewhere
    const dictCell = Cell.fromBase64(
        'te6cckEBEwEA6wACA8+YBgECAWILAgIBSAQDAEtIAcuQxF7zvON84K5eKbylmjJu1X2yjT8eDCtfro+fIkqiYHoSEAIBIBEFAEkgBy5DEXvO843zgrl4pvKWaMm7VfbKNPx4MK1+uj58iSqJYahAAgEgCAcCASAJCQIBIAoJAgEgCwsCASAMCwIBIA0NAgEgDg0CASAPDwIBIBAPAgEgERECASASEQBLIAcuQxF7zvON84K5eKbylmjJu1X2yjT8eDCtfro+fIkqiYHoSEAASyAEjzGkpjm2/c+RXlGt7siJMsPM02bz22WysLCwgxcbRAGB6EhA0myt7w=='
    ); // наш top hash
    const dict = dictCell.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), airdropEntryValue); // достаем словарь участвующих

    const entryIndex = 1n; // индекс в словаре для клейма( автоматизируется для каждого в фронте, чтобы у каждого при нажатии был индекс с его адрессом)

    const proof = dict.generateMerkleProof(entryIndex); // генерируем merkle proof для индекса в списке участвующих()

    const helper = provider.open( // проверка( подробно AirdropHelper.ts)
        AirdropHelper.createFromConfig(
            {
                airdrop: Address.parse('EQArE2brjROBlEPMY0TtpW_WgJcgX0jPC6EzvUdgtORHCcf9'), // адрес задеплоенного контракта аирдропа
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
