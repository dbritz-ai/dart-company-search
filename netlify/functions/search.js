// /netlify/functions/search.js - CSV 기반 초고속 자동완성
const fs = require('fs');
const path = require('path');

// 메모리 캐시
let companyList = null;

function loadCompanyList() {
  if (companyList) return companyList;
  
  try {
    // CSV 파일 읽기 (같은 functions 폴더 내)
    const csvPath = path.join(__dirname, 'corp_list.csv');
    const csv = fs.readFileSync(csvPath, 'utf-8');
    
    // CSV 파싱 (헤더 제외)
    const lines = csv.trim().split('\n').slice(1);
    companyList = lines.map(line => {
      const [corp_code, corp_name, stock_code, modify_date] = line.split(',').map(x => x.trim());
      return { 
        corp_code: corp_code || '',
        corp_name: corp_name || '',
        stock_code: stock_code || ''
      };
    }).filter(c => c.corp_code && c.corp_name); // 유효한 데이터만
    
    console.log(`회사목록 로드 완료: ${companyList.length}개`);
    return companyList;
    
  } catch (error) {
    console.error('CSV 로드 실패:', error);
    
    // fallback 데이터
    companyList = [
      { corp_name: "삼성전자", corp_code: "00126380", stock_code: "005930" },
      { corp_name: "카카오", corp_code: "00262701", stock_code: "035720" },
      { corp_name: "네이버", corp_code: "00120182", stock_code: "035420" },
      { corp_name: "LG전자", corp_code: "00401731", stock_code: "066570" },
      { corp_name: "SK하이닉스", corp_code: "00164779", stock_code: "000660" }
    ];
    
    return companyList;
  }
}

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
      return { statusCode: 400, headers, body: JSON.stringify({ error: '검색어가 필요합니다.' }) };
    }

    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }

    // 회사목록 로드 (최초 1회만)
    const companies = loadCompanyList();
    
    // 초고속 메모리 검색
    const results = companies.filter(company => {
      // 회사명 검색 (대소문자 구분 없이)
      const nameMatch = company.corp_name && company.corp_name.toLowerCase().includes(q);
      
      // 종목코드 검색
      const codeMatch = company.stock_code && company.stock_code.includes(query);
      
      return nameMatch || codeMatch;
    }).slice(0, 20); // 최대 20개

    console.log(`검색어: "${query}" -> ${results.length}개 결과`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('검색 함수 에러:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '검색 중 오류가 발생했습니다: ' + error.message })
    };
  }
};
