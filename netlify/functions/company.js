// netlify/functions/company.js - DART API 직접 호출
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { corp_code } = event.queryStringParameters || {};
  const apiKey = process.env.DART_API_KEY;

  if (!corp_code) {
    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: 'corp_code가 필요합니다' }) 
    };
  }

  if (!apiKey) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'DART_API_KEY 환경변수가 설정되지 않았습니다' }) 
    };
  }

  try {
    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corp_code}`;
    
    console.log(`기업개황 조회: ${corp_code}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`DART API 응답: status=${data.status}, message=${data.message}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('DART API 호출 실패:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '서버 오류: ' + error.message })
    };
  }
};
