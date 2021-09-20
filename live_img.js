let an = document.querySelectorAll(".an");
let img = document.querySelector(".zhuti").querySelectorAll("img");
// console.log(an);
// console.log(img.length);
for (let i = 0;i<an.length;i++){
    an[0].style.backgroundColor = 'rgb(255, 255, 255)';
    an[i].onclick = function (){
        for (let j = 0;j<img.length;j++){
            img[j].src = 'img/'+ i + j + '.jpg';
        }
        for (let i = 0;i<an.length;i++){
            an[i].style.backgroundColor = '';
        }
        an[i].style.backgroundColor = 'rgb(255, 255, 255)';
    }
}