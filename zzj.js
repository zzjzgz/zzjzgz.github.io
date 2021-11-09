
// 爱好
let data = document.querySelector(".data");
let data_li = data.querySelectorAll("li");
let w = document.querySelectorAll(".w")
// console.log(data_li);
// console.log(w);
data_li[0].className = 'change';
for (let i = 0;i<data_li.length;i++){
    data_li[i].onclick = function(){
        for (let i = 0;i<data_li.length;i++){
            data_li[i].className = '';
    //这里采用排他思想----点击事件发生后清空上一个事件的类
            w[i].style.display = 'none';
    //并将上一个事件的内容隐藏起来
        }
        this.className = 'change';
    //给事件添加交互的类
        w[i].style.display = 'block';
    //并将该点击事件的内容显示
    }
}

// 壁纸
let competition = document.querySelector(".right_competition");
let competition_li = competition.querySelector("ul").querySelectorAll("li");
let img = competition.querySelector("#img").querySelector("img");
let a = competition.querySelector("#img").querySelector("a");
let p = competition.querySelector("p");
competition_li[0].style.backgroundColor = "rgba(86, 219, 243)";
for (let i = 0;i<competition_li.length;i++){
    competition_li[i].onclick = function(){
     for (let i = 0;i<competition_li.length;i++){
         competition_li[i].style.backgroundColor = "rgba(255, 255, 255,0.57)";
     }
     competition_li[i].style.backgroundColor = "rgba(86, 219, 243)";
     img.src = "https://gitee.com/zzjzgz/img/raw/master/imgs/"+ i +".jpg";
     a.href = "https://gitee.com/zzjzgz/img/raw/master/imgs/"+ i +".jpg";
     if (i == 0){
         p.innerHTML = '现在你就是我的darling。'
     }
     if (i == 1){
         p.innerHTML = '自己的伤自己承受，只要依然活着，伤总有一天还是会好的。'
     }
     if (i == 2){
         p.innerHTML = '要诅咒，就诅咒弱小的自己好了。这个世界上所有不利条件都是因为当事人能力不足所致。'
     }
     if (i == 3){
         p.innerHTML = '不论是我或是其它任何人,都不是为了死亡而存在,是为了活下去而活着。'
     }
    }
}