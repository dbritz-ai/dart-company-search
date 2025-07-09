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
    const { query } = event.queryStringParameters || {};
    
    console.log('검색 요청:', query); // 디버깅용
    
    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '검색어가 필요합니다' })
      };
    }

    const apiKey = process.env.DART_API_KEY;
    console.log('API 키 존재 여부:', !!apiKey); // 디버깅용
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'DART API 키가 설정되지 않았습니다' })
      };
    }

    // DART API URL - 임시로 삼성전자 corp_code 사용 (테스트용)
    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=00126380`;
    console.log('요청 URL:', url.replace(apiKey, 'API_KEY_HIDDEN')); // 디버깅용 (키는 숨김)
    
    // DART API 호출
    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let responseData = '';
        
        console.log('응답 상태 코드:', res.statusCode);
        console.log('응답 헤더:', res.headers);
        
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          console.log('원본 응답 데이터:', responseData); // 디버깅용
          
          try {
            if (!responseData.trim()) {
              reject(new Error('빈 응답을 받았습니다'));
              return;
            }
            
            const jsonData = JSON.parse(responseData);
            console.log('파싱된 JSON:', jsonData); // 디버깅용
            resolve(jsonData);
            
          } catch (error) {
            console.error('JSON 파싱 실패:', error);
            console.error('원본 응답 (처음 200자):', responseData.substring(0, 200));
            reject(new Error(`API 응답 파싱 실패: ${error.message}. 응답: ${responseData.substring(0, 100)}`));
          }
        });
      }).on('error', (error) => {
        console.error('HTTPS 요청 실패:', error);
        reject(new Error('DART API 호출 실패: ' + error.message));
      });
    });

    console.log('DART API 응답 상태:', data.status); // 디버깅용

    // 응답 처리
    if (data.status === '000') {
      console.log('성공적인 응답');
      // 단일 회사 정보를 배열로 반환 (기존 구조 유지)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([{
          corp_name: data.corp_name,
          corp_code: '00126380',
          stock_code: data.stock_code
        }])
      };
    } else {
      console.log('DART API 에러:', data.status, data.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message || '검색 실패' })
      };
    }

  } catch (error) {
    console.error('전체 함수 에러:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '서버 오류: ' + error.message })
    };
  }
};
