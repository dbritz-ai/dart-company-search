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

    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'DART API 키가 환경변수에 없습니다.' }) };
    }

    // 로컬 인기 회사 배열 (fallback & 초간단 자동완성)
    const popularCompanies = [
      { corp_name: "삼성전자", corp_code: "00126380", stock_code: "005930" },
      { corp_name: "SK하이닉스", corp_code: "00164779", stock_code: "000660" },
      { corp_name: "LG전자", corp_code: "00401731", stock_code: "066570" },
      { corp_name: "네이버", corp_code: "00120182", stock_code: "035420" },
      { corp_name: "카카오", corp_code: "00262701", stock_code: "035720" },
      { corp_name: "현대자동차", corp_code: "00164742", stock_code: "005380" },
      { corp_name: "기아", corp_code: "00164779", stock_code: "000270" },
      { corp_name: "포스코홀딩스", corp_code: "00164186", stock_code: "005490" },
      { corp_name: "LG화학", corp_code: "00401068", stock_code: "051910" },
      { corp_name: "삼성SDI", corp_code: "00164921", stock_code: "006400" }
    ];

    // 1글자는 로컬에서만 검색 (API 트래픽 보호)
    if (query.length === 1) {
      const results = popularCompanies.filter(c =>
        c.corp_name.includes(query) || c.stock_code.includes(query)
      );
      return { statusCode: 200, headers, body: JSON.stringify(results) };
    }

    // 실제 DART API에서 검색 (공시 1개월 기준, 최신순)
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const endDate = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startDate = oneMonthAgo.toISOString().slice(0, 10).replace(/-/g, '');

    const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&bgn_de=${startDate}&end_de=${endDate}&page_count=50&sort=crp`;
    const response = await fetch(url);
    const data = await response.json();

    // DART 에러/비정상 응답
    if (data.status && data.status !== '000') {
      // '013'은 공시없음, fallback 사용
      if (data.status === '013') {
        const results = popularCompanies.filter(c =>
          c.corp_name.includes(query) || c.stock_code.includes(query)
        );
        return { statusCode: 200, headers, body: JSON.stringify(results) };
      }
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message || '검색 중 오류가 발생했습니다.' })
      };
    }

    // 공시 목록에서 회사명/종목코드 포함된 회사만 추출
    const companies = [];
    const seen = new Set();
    if (data.list && Array.isArray(data.list)) {
      for (const item of data.list) {
        if (
          (item.corp_name && item.corp_name.includes(query)) ||
          (item.stock_code && item.stock_code.includes(query))
        ) {
          const key = `${item.corp_code}-${item.corp_name}`;
          if (!seen.has(key)) {
            seen.add(key);
            companies.push({
              corp_name: item.corp_name,
              corp_code: item.corp_code,
              stock_code: item.stock_code || ''
            });
            if (companies.length >= 20) break;
          }
        }
      }
    }

    // 결과가 없으면 로컬 fallback
    if (companies.length === 0) {
      const results = popularCompanies.filter(c =>
        c.corp_name.includes(query) || c.stock_code.includes(query)
      );
      return { statusCode: 200, headers, body: JSON.stringify(results) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(companies)
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
