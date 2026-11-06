(function(){
  if(document.querySelector('.zp-right-rail'))return;
  var app=document.querySelector('.app'),main=app&&app.querySelector('.mn');
  if(!app||!main)return;
  var rail=document.createElement('aside');
  rail.className='zp-right-rail';
  rail.setAttribute('aria-label','ZipPrep tools and study information');
  rail.innerHTML=
    '<section class="zp-rail-card zp-rail-intro">'+
      '<p class="zp-rail-kicker">YOUR STUDY WORKSPACE</p>'+
      '<h2 class="zp-rail-head">Stay on track</h2>'+
      '<p class="zp-rail-muted">A focused place to practise, revise and prepare for your next exam.</p>'+
      '<div class="zp-rail-stat"><strong>5,000</strong><span>practice questions in the question bank</span></div>'+
      '<div class="zp-rail-stat"><strong>50</strong><span>questions in a full mock-test attempt</span></div>'+
    '</section>'+
    '<section class="zp-rail-card">'+
      '<h2 class="zp-rail-head">Quick Access</h2>'+
      '<div class="zp-rail-links">'+
        '<a href="#exam">Start a mock test <span>→</span></a>'+
        '<a href="#notes">Browse study notes <span>→</span></a>'+
        '<a href="#q">Practise questions <span>→</span></a>'+
        '<a href="#v-india">Explore India <span>→</span></a>'+
      '</div>'+
    '</section>'+
    '<section class="zp-rail-card zp-tip">'+
      '<p class="zp-rail-kicker">A BETTER STUDY HABIT</p>'+
      '<h2 class="zp-rail-head">Learn by reviewing</h2>'+
      '<p class="zp-rail-muted">After each practice session, revisit the explanations for questions you missed. Understanding why an answer is correct is as important as getting it right.</p>'+
      '<a href="#q">Continue practising&nbsp; →</a>'+
    '</section>';
  app.appendChild(rail);
})();