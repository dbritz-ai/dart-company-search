// netlify/functions/company.js
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
    const { corp_code } = event.queryStringParameters || {};
    if (!corp_code) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: '회사 코드가 필요합니다.' }) };
    }

    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'DART API 키가 환경변수에 없습니다.' }) };
    }

    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corp_code}`;
    const response = await fetch(url);
    const data = await response.json();

    // DART API 정상 응답이 아닐 때
    if (data.status && data.status !== '000') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message || '회사 정보를 찾을 수 없습니다.' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '서버 오류: ' + error.message })
    };
  }
};
