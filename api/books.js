// Vercel Node.js Serverless Function. API credentials stay server-side.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q || q.length > 120) return res.status(400).json({error:'검색어는 1~120자여야 합니다.'});
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return res.status(503).json({error:'서버에 KAKAO_REST_API_KEY가 설정되지 않았습니다.'});
  const url = new URL('https://dapi.kakao.com/v3/search/book');
  url.searchParams.set('query',q);
  url.searchParams.set('size','15');
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),9000);
  try {
    const response = await fetch(url, {headers:{Authorization:'KakaoAK '+key},signal:controller.signal});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) return res.status(502).json({error:'카카오 검색 응답 '+response.status,detail:data.msg||data.message||''});
    return res.status(200).json({documents:data.documents||[],meta:data.meta||{}});
  } catch (e) {return res.status(502).json({error:e.name==='AbortError'?'카카오 검색 시간 초과':'카카오 검색 연결 오류'});}
  finally {clearTimeout(timeout)}
};
