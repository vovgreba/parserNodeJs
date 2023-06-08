import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import Cottage from './Schema.js'
import fs from 'fs'

mongoose.connect('mongodb://localhost:27017/Cottages')
  .then(() => console.log('Connected!'));
  
const parseAndOpenNewPage = async(link) => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setViewport({width: 980, height: 600})
  await page.goto(link, {waitUntil: 'domcontentloaded'});
  return { browser, page };
}


(async () => {
  const {browser, page} = await parseAndOpenNewPage('https://www.karpaty.info/ua/recreation/residence/?res_type=house')

  const maxPage = await page.evaluate(() => {
    return document.querySelectorAll('.pagination li').length
  })
  let index = 1
  let links = [];
  while(  index <= 3) {

    let arrayLinks = await page.$$eval('.objlist-li.ad > a, .objlist-li > a', elements => {
      return elements.map(el => el.href)
    })

    links.push(...arrayLinks)

    const nextLink = await page.$eval('.pagination .active', activeElement  => {
      return activeElement?.nextElementSibling?.querySelector('a')?.href;
    })
    if(nextLink) {
      await page.goto(nextLink, {waitUntil: 'domcontentloaded'});
    } else {
      break;
    }
    index++
  }
  
  let arrayCottage = []
  
  for (const link of links) {
    const {browser, page} = await parseAndOpenNewPage(link)
    const data = await page.evaluate(() => {
      const getParseAndCleanText = (text) => {
        let cleanText = null
        if (text && text.length > 0) {
           cleanText = text.replace(/\s+/g, ' ').trim()
        }
        return cleanText
      }
      const dataCottage = {};
      dataCottage.title = document.querySelector('h2').textContent;
      dataCottage.imagesLinks = Array.from(document.querySelectorAll('.slyframe .slidee > li > a'), el => el.href)
      const classSelector = Array.from(document.querySelectorAll('.uheader-content'))
      .filter(el => el.previousElementSibling.textContent)
      
      classSelector.forEach(el => {
        const textElement = el.previousElementSibling.textContent
        if(textElement.startsWith('Ціна') || textElement.startsWith('Ціни')) {
          dataCottage.pricePerDay = getParseAndCleanText(el.textContent);
        }
        switch (textElement) {
          case 'Розташування:':
            dataCottage.location = getParseAndCleanText(el.textContent);
            break;
          case 'Опис:':
            dataCottage.description = getParseAndCleanText(el.textContent);
            break;
          case 'Котеджі:':
            dataCottage.cottage = getParseAndCleanText(el.textContent);
            break;
          case 'Харчування:':
            dataCottage.food = getParseAndCleanText(el.textContent);
            break;
          case 'Сервіс, включений у вартість:':
            dataCottage.serviceIncluded = getParseAndCleanText(el.textContent);
            break;
          case 'Сервіс за додаткову оплату:':
            dataCottage.extraService = getParseAndCleanText(el.textContent);
            break;
          case 'Спорт, розваги:':
            dataCottage.activities = getParseAndCleanText(el.textContent);
            break;
          case 'Мобільне покриття:':
            dataCottage.mobileCoverage = getParseAndCleanText(el.textContent);
            break;
          case 'Іноземні мови:':
            dataCottage.foreignLanguages = getParseAndCleanText(el.textContent);
            break;
          case 'Примітки від karpaty.info:':
            dataCottage.karpatyInfo = getParseAndCleanText(el.textContent);
            break;
          case 'Контакти:':
            dataCottage.contacts = getParseAndCleanText(el.textContent);
            break;
          case 'Як доїхати:':
            dataCottage.directions = getParseAndCleanText(el.textContent);
            break;
          case 'GPS:':
            dataCottage.gps = getParseAndCleanText(el.textContent);
            break;
          case 'Від господарів садиби:':
            dataCottage.reviews = getParseAndCleanText(el.textContent);
            break;
          default:
            break;
        }
      })
      

      return dataCottage
    })
    const cottage = new Cottage(data);
    cottage.save()
    .catch((error) => {
      console.error('Error saving cottage to DB:', error);
    });
    arrayCottage.push(data)
    await browser.close();
  }
  await browser.close();
  const jsonData = JSON.stringify(arrayCottage, null, 2);
  fs.writeFile('data.json', jsonData, 'utf8', (err) => {
    if (err) {
      console.error('Помилка запису у файл:', err);
      return;
    }
    console.log('Дані було успішно записано у файл data.json');
  });
  
})();


// !!!! "Only parses a specific page."


// (async () => {
//   const pageCottage = await parseAndOpenNewPage('https://www.karpaty.info/ua/uk/lv/st/volosyanka/houses/karpatski.beskydy/');

//   const data = await pageCottage.evaluate(() => {
//     const getParseAndCleanText = (text) => {

//       const cleanText = text.replace(/\s+/g, ' ').trim();
//       return cleanText;
//     };
//     const dataCottage = {};
//     dataCottage.title = document.querySelector('h2').textContent;
//     dataCottage.imagesLinks = Array.from(document.querySelectorAll('.slyframe .slidee > li > a'), el => el.href)

//     const elements = Array.from(document.querySelectorAll('.uheader-content'))
//     .filter(el => {
//       return el.previousElementSibling.textContent
//     })

//     elements.forEach(el => {
//       const textElement = el.previousElementSibling.textContent
//       if(textElement.startsWith('Ціна') || textElement.startsWith('Ціни')) {
//         dataCottage.pricePerDay = getParseAndCleanText(el.textContent);
//       }
//       switch (textElement) {
//         case 'Розташування:':
//           dataCottage.location = getParseAndCleanText(el.textContent);
//           break;
//         case 'Опис:':
//           dataCottage.description = getParseAndCleanText(el.textContent);
//           break;
//         case 'Котеджі:':
//           dataCottage.cottage = getParseAndCleanText(el.textContent);
//           break;
//         case 'Харчування:':
//           dataCottage.food = getParseAndCleanText(el.textContent);
//           break;
//         case 'Сервіс, включений у вартість:':
//           dataCottage.serviceIncluded = getParseAndCleanText(el.textContent);
//           break;
//         case 'Сервіс за додаткову оплату:':
//           dataCottage.extraService = getParseAndCleanText(el.textContent);
//           break;
//         case 'Спорт, розваги:':
//           dataCottage.activities = getParseAndCleanText(el.textContent);
//           break;
//         case 'Мобільне покриття:':
//           dataCottage.mobileCoverage = getParseAndCleanText(el.textContent);
//           break;
//         case 'Іноземні мови:':
//           dataCottage.foreignLanguages = getParseAndCleanText(el.textContent);
//           break;
//         case 'Контакти:':
//           dataCottage.contacts = getParseAndCleanText(el.textContent);
//           break;
//         case 'Як доїхати:':
//           dataCottage.directions = getParseAndCleanText(el.textContent);
//           break;
//         case 'GPS:':
//           dataCottage.gps = getParseAndCleanText(el.textContent);
//           break;
//         case 'Від господарів садиби:':
//           dataCottage.reviews = getParseAndCleanText(el.textContent);
//           break;
//         default:
//           break;
//       }
//     })

  
//   return dataCottage

//   });
  
//   const cottage = new Cottage(data);
//   cottage.save()
//   .then((savedCottage) => {
//     console.log('Cottage saved:', savedCottage);
//   })
//   .catch((error) => {
//     console.error('Error saving cottage:', error);
//   });
  
// })();

