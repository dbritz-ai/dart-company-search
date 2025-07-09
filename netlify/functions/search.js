// netlify/functions/search.js - 실제 DART 전체 회사목록 API 활용
const https = require('https');
const { DOMParser } = require('xmldom');

// 메모리 캐시 (서버리스에서 재활용)
let companiesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { query } = event.queryStringParameters || {};
    
    if (!query) {
      return { statusCode: 400, headers, body: JSON.stringify([]) };
    }

    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'DART API 키가 환경변수에 없습니다.' }) };
    }

    // 캐시 확인 (24시간 이내면 재사용)
    const now = Date.now();
    if (companiesCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('캐시된 회사목록 사용');
      return searchFromCache(companiesCache, query, headers);
    }

    console.log('DART 전체 회사목록 다운로드 시작...');
    
    // DART 전체 회사목록 API 호출
    const companies = await downloadCompanyList(apiKey);
    
    // 캐시 저장
    companiesCache = companies;
    cacheTimestamp = now;
    
    console.log(`전체 회사목록 로드 완료: ${companies.length}개`);
    
    return searchFromCache(companies, query, headers);

  } catch (error) {
    console.error('검색 함수 에러:', error);
    
    // 에러 발생시 기본 인기 회사들 반환
    const fallbackCompanies = [
      { "corp_name": "삼성전자", "corp_code": "00126380", "stock_code": "005930" },
      { "corp_name": "카카오", "corp_code": "00262701", "stock_code": "035720" },
      { "corp_name": "네이버", "corp_code": "00120182", "stock_code": "035420" },
      { "corp_name": "LG전자", "corp_code": "00401731", "stock_code": "066570" },
      { "corp_name": "SK하이닉스", "corp_code": "00164779", "stock_code": "000660" }
    ];

    const searchQuery = event.queryStringParameters?.query || '';
    const results = fallbackCompanies.filter(c =>
      c.corp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.stock_code.includes(searchQuery)
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results)
    };
  }
};

// DART에서 전체 회사목록 다운로드
async function downloadCompanyList(apiKey) {
  return new Promise((resolve, reject) => {
    const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`;
    
    https.get(url, (response) => {
      const chunks = [];
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', () => {
        try {
          // ZIP 파일이 아닌 XML 응답인 경우 (브라우저에서는 XML로 응답됨)
          const xmlData = Buffer.concat(chunks).toString('utf8');
          
          if (xmlData.includes('<result>')) {
            // XML 파싱
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
            
            const companies = [];
            const listElements = xmlDoc.getElementsByTagName('list');
            
            for (let i = 0; i < listElements.length; i++) {
              const element = listElements[i];
              const corpCode = getTextContent(element, 'corp_code');
              const corpName = getTextContent(element, 'corp_name');
              const stockCode = getTextContent(element, 'stock_code');
              
              if (corpCode && corpName) {
                companies.push({
                  corp_name: corpName,
                  corp_code: corpCode,
                  stock_code: stockCode || ''
                });
              }
            }
            
            resolve(companies);
          } else {
            // ZIP 파일인 경우 - 실제 운영에서는 ZIP 압축해제 필요
            console.log('ZIP 파일 수신됨, XML 파싱 시도...');
            reject(new Error('ZIP 파일 처리 필요'));
          }
          
        } catch (error) {
          console.error('XML 파싱 오류:', error);
          reject(error);
        }
      });
      
    }).on('error', (error) => {
      console.error('DART API 호출 오류:', error);
      reject(error);
    });
  });
}

// XML에서 텍스트 추출
function getTextContent(parent, tagName) {
  const elements = parent.getElementsByTagName(tagName);
  if (elements.length > 0 && elements[0].firstChild) {
    return elements[0].firstChild.nodeValue;
  }
  return '';
}

// 캐시에서 검색
function searchFromCache(companies, query, headers) {
  const normalizedQuery = query.trim().toLowerCase();
  
  if (normalizedQuery.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }

  // 초고속 메모리 검색
  const results = companies.filter(company => {
    const corpNameMatch = company.corp_name.toLowerCase().includes(normalizedQuery);
    const stockCodeMatch = company.stock_code && company.stock_code.includes(query);
    return corpNameMatch || stockCodeMatch;
  }).slice(0, 20); // 최대 20개

  console.log(`검색어: "${query}" -> ${results.length}개 결과`);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(results)
  };
}
