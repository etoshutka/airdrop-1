import { Address, beginCell, toNano } from '@ton/core';
import { Airdrop, AirdropEntry, generateEntriesDictionary } from '../wrappers/Airdrop';
import { compile, NetworkProvider } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';

export async function run(provider: NetworkProvider) { 
    const entries: AirdropEntry[] = [ // составление списка для формирования меркла(кто сможет заклеймить и сколько)
        {
            address: Address.parse('UQCR5jSUxzbfufIryjW92REmWHmabN57bLZWFhYQYuNogHrP'), // адрес клеймера
            amount: toNano('0.00025'), // кол-во жеттонов (здесь 0.25 USDT)
        },
        {
            address: Address.parse('UQDlyGIved5xvnBXLxTeUs0ZN2q-2UafjwYVr9dHz5ElURpi'),
            amount: toNano('0.00025'),
        },
    ];

    const dict = generateEntriesDictionary(entries); // сбор словаря с помощью функции из /wrappers/Airdrop.ts
    const dictCell = beginCell().storeDictDirect(dict).endCell(); // формирование ячейки , хранящей словарь
    console.log(`Dictionary cell (store it somewhere on your backend: ${dictCell.toBoc().toString('base64')}`); // вывод в консоль Top Hash меркла
    const merkleRoot = BigInt('0x' + dictCell.hash().toString('hex')); // формирование MerkleRoot

    const jettonMinterAddress = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'); // адресс мастер кошелька жеттона в которых будет производитсья дроп
    const jettonMinter = provider.open(JettonMinter.createFromAddress(jettonMinterAddress)); 

    const airdrop = provider.open( // создание конфига аирдропа ( детали в /wrappers/Airdrop.ts)
        Airdrop.createFromConfig(
            {
                merkleRoot,
                helperCode: await compile('AirdropHelper'),
            },
            await compile('Airdrop')
        )
    );

    await airdrop.sendDeploy(provider.sender(), toNano('0.05'), await jettonMinter.getWalletAddressOf(airdrop.address)); // непосредственно деплой

    await provider.waitForDeploy(airdrop.address);

    // run methods on `airdrop`
}
