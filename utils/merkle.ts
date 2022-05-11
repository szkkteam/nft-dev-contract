import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

export const generateRoot = (list: Array<string>) => {
    const leaves = list.map(item => keccak256(item));
    const tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
    const root = tree.getHexRoot();
    return { root, tree };
}

export const getProof = (tree: MerkleTree, address: string) => {
    return tree.getHexProof(keccak256(address));
}