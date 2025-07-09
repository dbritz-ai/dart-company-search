// /netlify/functions/company.js - DART API 상세정보 조회
const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
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
        body: JSON.stringify({ error: 'corp_code 파라미터가 필요합니다.' }) 
      };
    }

    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'DART API 키가 환경변수에 설정되지 않았습니다.' }) 
      };
    }

    console.log(`기업정보 조회 요청: ${corp_code}`);

    // DART API 호출
    const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corp_code}`;
    
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

    // DART API 응답 처리
    if (data.status === '000') {
      console.log(`기업정보 조회 성공: ${data.corp_name}`);
      
      // 필요한 필드만 정리해서 전달
      const companyInfo = {
        corp_name: data.corp_name || '',
        corp_name_eng: data.corp_name_eng || '',
        stock_code: data.stock_code || '',
        ceo_nm: data.ceo_nm || '',
        corp_cls: data.corp_cls || '',
        jurir_no: data.jurir_no || '',
        bizr_no: data.bizr_no || '',
        adres: data.adres || '',
        hm_url: data.hm_url || '',
        ir_url: data.ir_url || '',
        phn_no: data.phn_no || '',
        fax_no: data.fax_no || '',
        induty_code: data.induty_code || '',
        est_dt: data.est_dt || ''
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(companyInfo)
      };
    } else {
      console.log(`DART API 에러: ${data.status} - ${data.message}`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message || '조회된 데이터가 없습니다.' })
      };
    }

  } catch (error) {
    console.error('Company 함수 에러:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '서버 오류: ' + error.message })
    };
  }
};
