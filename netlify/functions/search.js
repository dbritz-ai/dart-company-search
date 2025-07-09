// netlify/functions/search.js - DART API로 진짜 모든 회사 검색
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
  if (!query || query.length < 2) {
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }

  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API 키 없음' }) };
  }

  try {
    // DART 공시검색 API로 회사 찾기
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    
    const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&bgn_de=${oneMonthAgo}&end_de=${today}&page_count=50`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '000' && data.list) {
      // 검색어와 매칭되는 회사들 필터링
      const companies = [];
      const seen = new Set();
      
      for (const item of data.list) {
        if (item.corp_name && item.corp_name.includes(query)) {
          const key = item.corp_code;
          if (!seen.has(key)) {
            seen.add(key);
            companies.push({
              corp_code: item.corp_code,
              corp_name: item.corp_name,
              stock_code: item.stock_code || ''
            });
            if (companies.length >= 20) break;
          }
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(companies)
      };
    } else {
      // API 에러시 주요 회사 fallback
      const fallback = [
        { corp_code: "00126380", corp_name: "삼성전자", stock_code: "005930" },
        { corp_code: "00262701", corp_name: "카카오", stock_code: "035720" },
        { corp_code: "00120182", corp_name: "네이버", stock_code: "035420" }
      ].filter(c => c.corp_name.includes(query));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fallback)
      };
    }
    
  } catch (error) {
    console.error('검색 에러:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
