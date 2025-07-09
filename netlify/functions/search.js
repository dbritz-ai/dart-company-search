// netlify/functions/search.js
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

    // 회사 목록을 직접 관리 (10~30개까지는 충분!)
    const companies = [
      { corp_name: "삼성전자", corp_code: "00126380", stock_code: "005930" },
      { corp_name: "카카오", corp_code: "00262701", stock_code: "035720" },
      { corp_name: "네이버", corp_code: "00120182", stock_code: "035420" },
      { corp_name: "LG전자", corp_code: "00401731", stock_code: "066570" },
      { corp_name: "SK하이닉스", corp_code: "00164779", stock_code: "000660" },
      { corp_name: "현대자동차", corp_code: "00164742", stock_code: "005380" },
      { corp_name: "기아", corp_code: "00164779", stock_code: "000270" },
      { corp_name: "포스코홀딩스", corp_code: "00164186", stock_code: "005490" },
      { corp_name: "LG화학", corp_code: "00401068", stock_code: "051910" },
      { corp_name: "삼성SDI", corp_code: "00164921", stock_code: "006400" },
    ];

    // 검색 (회사명, 종목코드 부분일치)
    const q = query.trim();
    const results = companies.filter(c =>
      c.corp_name.includes(q) || c.stock_code.includes(q)
    );

    return { statusCode: 200, headers, body: JSON.stringify(results) };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '검색 중 오류가 발생했습니다.' })
    };
  }
};
