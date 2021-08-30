var span = document.querySelectorAll('span');
// console.log(span);
for (let i = 0;i<span.length;i++){
    span[0].style.backgroundColor = 'rgba(255, 255,255,1)';
    span[i].onclick = function(){
        for (let i = 0;i<span.length;i++){
            span[i].style.backgroundColor =''
        }
        span[i].style.backgroundColor = 'rgba(255, 255,255,1)'
        // let zzj = document.getElementById('zzj');
        // let img = document.querySelectorAll('img')[i+1];
        // zzj.src = img.src;
        
        if (i==0){
            document.getElementsByTagName('body')[0].style.backgroundImage='url(img/fj.png)';
        }
        if (i==1){
            document.getElementsByTagName('body')[0].style.backgroundImage='url(img/mz.png)';
        }
        if (i==2){
            document.getElementsByTagName('body')[0].style.backgroundImage='url(img/lm.png)';
        }
        if (i==3){
            document.getElementsByTagName('body')[0].style.backgroundImage='url(img/sh.png)';
        }
    }
}