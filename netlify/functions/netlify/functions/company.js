const https = require('https');

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // CORS preflight 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { corp_code } = event.queryStringParameters || {};
    
    if (!corp_code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '회사 코드가 필요합니다' })
      };
    }

    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'DART API 키가 설정되지 않았습니다' })
      };
    }

    // DART API URL - 기업개황 정보 조회
    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corp_code}`;
    
    // DART API 호출
    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve(jsonData);
          } catch (error) {
            reject(new Error('API 응답 파싱 실패'));
          }
        });
      }).on('error', (error) => {
        reject(new Error('DART API 호출 실패: ' + error.message));
      });
    });

    // 응답 처리
    if (data.status === '000') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message || '회사 정보 조회 실패' })
      };
    }

  } catch (error) {
    console.error('Company function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '서버 오류: ' + error.message })
    };
  }
};
