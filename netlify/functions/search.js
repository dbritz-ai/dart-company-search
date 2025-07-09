// netlify/functions/search.js - 정석 구조 (CSV 회사목록 기반)
const fs = require('fs');
const path = require('path');

// 메모리 캐시
let companyList = null;

function loadCompanyList() {
  if (companyList) return companyList;
  
  try {
    const csvPath = path.join(__dirname, 'corp_list.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // CSV 파싱 (헤더 제외)
    companyList = csvContent.trim().split('\n').slice(1).map(line => {
      const [corp_code, corp_name, stock_code] = line.split(',').map(x => x.trim());
      return { corp_code, corp_name, stock_code };
    }).filter(c => c.corp_code && c.corp_name);
    
    console.log(`회사목록 로드: ${companyList.length}개`);
    return companyList;
    
  } catch (error) {
    console.error('CSV 로드 실패:', error);
    // fallback
    return [
      { corp_code: "00126380", corp_name: "삼성전자", stock_code: "005930" },
      { corp_code: "00262701", corp_name: "카카오", stock_code: "035720" },
      { corp_code: "00120182", corp_name: "네이버", stock_code: "035420" }
    ];
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { query } = event.queryStringParameters || {};
  if (!query) {
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }

  const companies = loadCompanyList();
  
  // 회사명 또는 종목코드로 검색
  const results = companies.filter(c =>
    c.corp_name.includes(query) || (c.stock_code && c.stock_code.includes(query))
  ).slice(0, 20);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(results)
  };
};
