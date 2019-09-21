var products = [
    {name:"バナナジュース　",price:100,img:"./img/drink_banana_juice.png",io:[{"io0":false,"io1":true},{"io1":false}]},
    {name:"りんごジュース　",price:100,img:"./img/juice_apple.png",io:[{"io0":false,"io2":true},{"io2":false}]},
    {name:"オレンジジュース",price:100,img:"./img/juice_orange.png",io:[{"io0":false,"io3":true},{"io3":false}]},
    {name:"トマトジュース　",price:150,img:"./img/tomato_juice.png",io:[{"io0":false,"io4":true},{"io4":false}]},
    {name:"ホットケーキ　　",price:200,img:"./img/sweets_pancake.png",io:[{"io0":false,"io5":true},{"io5":false}]},
    {name:"ハンバーガー　　",price:300,img:"./img/food_hamburger.png",io:[{"io0":false,"io6":true},{"io6":false}]},
    {name:"カップケーキ　　",price:200,img:"./img/sweets_cupcake_red_velvet_cake.png",io:[{"io0":false,"io7":true},{"io7":false}]}
];

new Vue({
    el:"#app",
    data:{
        products:products,
        selected:""
    },
    methods:{
        onOrder:function(index){
            this.selected = this.products[index]
        },
        fixOrder:function(){
            var io = this.selected.io;
            var obnizid = "xxxx-xxxx";
            var data = [{
                "io": {
                    "animation": {
                        "name": "animation-1",
                        "status": "loop",
                        "repeat": 10,
                        "states": [
                            {
                                "duration": 500,
                                "state": io[0]
                            },
                            {
                                "duration": 500,
                                "state": io[1]
                            }
                        ]

                    }
                }
            }]
            console.log(data["io"]);
            console.log(axios.post("https://obniz.io/obniz/"+ obnizid +"/api/1",data));
            $('#order-fix-modal').modal('show');
        }
    }
})