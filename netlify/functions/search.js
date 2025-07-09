// netlify/functions/search.js - JSON 파일 기반 초고속 검색
const companies = require('./companies.json');

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
  
  // 검색어가 없거나 너무 짧으면 빈 배열 반환
  if (!query || query.length < 2) {
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }

  try {
    const q = query.trim().toLowerCase();
    
    // 초고속 부분검색 (회사명 + 종목코드)
    const results = companies.filter(company =>
      company.corp_name.toLowerCase().includes(q) ||
      (company.stock_code && company.stock_code.includes(query.toUpperCase()))
    ).slice(0, 20); // 최대 20개

    console.log(`검색어: "${query}" -> ${results.length}개 결과`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('검색 에러:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '검색 중 오류가 발생했습니다' })
    };
  }
};
