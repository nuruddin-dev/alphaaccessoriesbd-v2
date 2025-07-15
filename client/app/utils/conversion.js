export const convertToBengaliDigits = number => {
  const englishToBengali = {
    0: '০',
    1: '১',
    2: '২',
    3: '৩',
    4: '৪',
    5: '৫',
    6: '৬',
    7: '৭',
    8: '৮',
    9: '৯'
  };

  return number
    .toString()
    .split('')
    .map(digit => englishToBengali[digit] || digit)
    .join('');
};

export const convertToEnglishNumber = bengaliNumber => {
  const bengaliToEnglish = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9'
  };

  return bengaliNumber.replace(/[০-৯]/g, digit => bengaliToEnglish[digit]);
};

export const convertToBengaliColor = string => {
  const englishToBengali = {
    Black: 'কালো',
    White: 'সাদা',
    Red: 'লাল',
    Green: 'সবুজ',
    Blue: 'নীল',
    Gold: 'গোল্ডেন',
    Pink: 'গোলাপি',
    Yellow: 'হলুদ',
    Lime: 'টিয়ে'
  };

  return englishToBengali[string] || string;
};
