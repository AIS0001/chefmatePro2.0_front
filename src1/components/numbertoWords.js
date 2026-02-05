import { toWords } from 'number-to-words';

const getAmountInWords = (amount) => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let inWords = toWords(rupees).replace(/^\w/, c => c.toUpperCase()); // capitalize first letter
  let final = `${inWords} Rupees`;

  if (paise > 0) {
    final += ` and ${toWords(paise)} Paise`;
  }

  return final + ' Only';
};
export default getAmountInWords;