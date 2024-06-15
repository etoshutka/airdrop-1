import { Address, beginCell, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { TONAirdrop, TONAirdropEntry, TONgenerateEntriesDictionary } from '../wrappers/TONAirdrop';

export async function run(provider: NetworkProvider) { 
    const entries: TONAirdropEntry[] = [ // составление списка для формирования меркла(кто сможет заклеймить и сколько)
        {
            address: Address.parse('UQDlyGIved5xvnBXLxTeUs0ZN2q-2UafjwYVr9dHz5ElURpi'), // адрес клеймера
            amount: toNano('0.00025'), // кол-во жеттонов (здесь 0.25 USDT)
        },
        {
            address: Address.parse('UQDlyGIved5xvnBXLxTeUs0ZN2q-2UafjwYVr9dHz5ElURpi'),
            amount: toNano('0.00025'),
        },
        {
            address: Address.parse('UQDlyGIved5xvnBXLxTeUs0ZN2q-2UafjwYVr9dHz5ElURpi'),
            amount: toNano('0.00025'),
        },
    ];

    const dict = TONgenerateEntriesDictionary(entries); // сбор словаря с помощью функции из /wrappers/Airdrop.ts
    const dictCell = beginCell().storeDictDirect(dict).endCell(); // формирование ячейки , хранящей словарь
    console.log(`Dictionary cell (store it somewhere on your backend: ${dictCell.toBoc().toString('base64')}`); // вывод в консоль Top Hash меркла
    const merkleRoot = BigInt('0x' + dictCell.hash().toString('hex')); // формирование MerkleRoot
    const tonairdrop = provider.open(
        TONAirdrop.createFromConfig (
            {
                merkleRoot,
                helperCode: await compile('TONAirdrophelper'),
            },
            await compile('TONAirdrop')
        )
    );
    await tonairdrop.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(tonairdrop.address);

    // run methods on `airdrop`
}


