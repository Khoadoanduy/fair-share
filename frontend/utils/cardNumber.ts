export function parseBankNumber(bankNumber: number): [number, number, number, number] {
    console.log(bankNumber)
    const bankStr = bankNumber.toString();

    const group1 = parseInt(bankStr.substring(0, 4), 10);
    const group2 = parseInt(bankStr.substring(4, 8), 10);
    const group3 = parseInt(bankStr.substring(8, 12), 10);
    const group4 = parseInt(bankStr.substring(12, 16), 10);
    
    return [group1, group2, group3, group4];
  }

export function formatBankNumber(bankNumber: number): string {
    const groups = parseBankNumber(bankNumber);
    return groups.map(group => group.toString().padStart(4, '0')).join(' ');
}