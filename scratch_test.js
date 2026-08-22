async function testGetSearch(query) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const vIdx = html.indexOf('/watch?v=');
    if (vIdx !== -1) {
      const vid = html.substring(vIdx + 9, vIdx + 20);
      console.log('GET search found videoId:', vid, '-> https://music.youtube.com/watch?v=' + vid);
      return vid;
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

async function run() {
  await testGetSearch('East Duo Chubina');
  await testGetSearch('Sero Produktion Beats Yargi Slowed');
  await testGetSearch('Dedublüman Aleyna Tilki Sana Güvenmiyorum');
}

run();
