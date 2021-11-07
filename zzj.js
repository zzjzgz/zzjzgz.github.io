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