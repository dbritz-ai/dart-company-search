// netlify/functions/company.js - 간단하고 확실한 버전
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
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'corp_code가 필요합니다' }) 
      };
    }

    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'DART_API_KEY 환경변수가 없습니다' }) 
      };
    }

    // 간단한 DART API 호출
    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corp_code}`;
    
    console.log(`DART API 호출: corp_code=${corp_code}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('DART API 응답:', data);

    // DART API 직접 응답 확인
    if (data.status === '000') {
      // 성공 - 데이터 그대로 반환
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    } else {
      // DART API 에러
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `DART API 에러: ${data.status} - ${data.message}` 
        })
      };
    }

  } catch (error) {
    console.error('Company API 에러:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '서버 오류: ' + error.message })
    };
  }
};
