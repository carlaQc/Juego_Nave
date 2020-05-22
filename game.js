//VARIABLES
var fondoJuego;
var nave;
var derecha;
var izquierda;
var asteroides;
var texto;
var spacebar;
var sonidoDisparo;
var damage;
var recarga_energia;
var recarga_vida;

var iniciar; 

 //CONSTANTES
const vidaNave = 5;
const municionInicial = 20;
const puntuacionInicial = 0;
const velocidadNave = 800;
const minAsteroides = 2;
const maxAsteroides = 3;
const velocidadCaida = 4;
const tiempoAparicion = 600;
const probabilidadEnergia = 10;
const municionPorEnergia = 5;
const probabilidadVida = 5;
const existenciaPorVida = 1;
const puntuacionPorEliminacion = 2;


var tiempo = {
   minutos: '00',
    segundos: '00'
}
 
var tiempoUltimaPartida = tiempo;
var tiempoMejorPartida = tiempo;


//ESCENA INICIO
var Inicio = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Inicio() {
            Phaser.Scene.call(this, { key: 'Inicio' });
        },

    create() {
        tiempo = {
            minutos: '00',
            segundos: '00'
       }
       
        this.add.text(10, 10, 'Ultima Partida: ' + tiempoUltimaPartida.minutos + ':' + tiempoUltimaPartida.segundos +
            '\nMejor tiempo: ' + tiempoMejorPartida.minutos + ':' + tiempoMejorPartida.segundos,  {  
                fontSize: '20px',
                fill: '#ffffff'
            });
        
            
            
        var texto = this.add.text(game.config.width / 2, game.config.height / 2, 'INICIAR PARTIDA', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();
        texto.on('pointerdown', () => {   //dar click
            this.scene.start('Principal');
        });

        iniciar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        iniciar.reset();
    },

    update() {
        if (iniciar.isDown) {
            this.scene.start('Principal');
        }
    }
});

//ESCENA PRINCIPAL
var Principal = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Principal() {
            Phaser.Scene.call(this, { key: 'Principal' });
        },
        
    //Aqui recargaremos todos los recursos necesarios
    preload() {

        //importando imagenes
        this.load.image('fondo','assets/sprites/galaxia0.jpg')
        this.load.image('nave', 'assets/sprites/nave0.png');
        this.load.image('asteroides', 'assets/sprites/asteroides1.png');
        this.load.image('bala', 'assets/sprites/bala.png');
        this.load.image('energia', 'assets/sprites/energia.png');
        this.load.image('vida', 'assets/sprites/vida.png');
        //importando audios
        this.load.audio('sonidoDisparo', 'assets/sonidos/disparo.wav');
        this.load.audio('damage', 'assets/sonidos/damage.wav');
        this.load.audio('recarga_energia', 'assets/sonidos/recarga_energia.wav');
        this.load.audio('recarga_vida', 'assets/sonidos/recarga_vida.wav');
    },

    //Aqui es donde inicializaremos todos los elementos de nuestro video juego
    create() {
        fondoJuego =this.add.tileSprite (0, 0, 2500, 1200, 'fondo')
        
        //inicilizando el sprite NAVE
        nave = this.physics.add.sprite(game.config.width / 2, game.config.height - 100, 'nave')
        nave.vida = vidaNave;
        nave.municion = municionInicial;
        nave.score = puntuacionInicial;
        nave.setCollideWorldBounds(true);  //para que la nave no pueda salir del mundo
        
        //inicializando los sonidos en una variable
        sonidoDisparo = this.sound.add('sonidoDisparo');
        damage = this.sound.add('damage');
        recarga_energia = this.sound.add('recarga_energia');
        recarga_vida = this.sound.add('recarga_vida');


        texto = this.add.text(10, 10, '', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setDepth(0.1);
        this.actualizarTexto();

        // ASTEROIDES
        asteroides = this.physics.add.group({   //grupo de asteroides
            defaultKey: 'asteroides',           // Key de asteroides
            maxSize: 40  // cantidad de asteroides que podran estar cargados al mismo tiempo
        });

        // BALAS
        balas = this.physics.add.group({   //grupo de balas
            classType: bala,         //clase que se utilizara
            maxSize: 20,            
            runChildUpdate: true

        });
        

        //BOLAS DE ENERGIA
        bolasEnergia = this.physics.add.group({  //grupo de energia
            defaultKey: 'energia',              //Key de Energia
            maxSize: 10                         //cantidad de energia que podran estar cargados al mismo tiempo
        });
  
        //VIDA
        corazonVida = this.physics.add.group({  //grupo de vida
            defaultKey: 'vida',              //Key de vida
            maxSize: 5                       //cantidad de vida que podran estar cargados al mismo tiempo
        });

        
        this.time.addEvent({
            delay: tiempoAparicion,
            loop: true,                    //se repita una y otra vez
            callback: () => {
                this.generarAsteroides()  //evento que lanzara
            }
        });

    
       this.time.addEvent({
            delay: 1000,
            loop: true,                   //se repite una y otra vez
            callback: () => {
                this.actualizarContador(); //evento que lanzara
            }
        });

        //Overlap (colicion) 
        this.physics.add.overlap(nave, asteroides, this.colisionNaveAsteroide, null, this);
        this.physics.add.overlap(balas, asteroides, this.colisionBalaAsteroide, null, this);
        this.physics.add.overlap(nave, bolasEnergia, this.colisionNaveEnergia, null, this);
        this.physics.add.overlap(nave, corazonVida, this.colisionNaveVida, null, this);

        //CONTROLES DE TECLA
        derecha = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);  
        izquierda = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        console.log(this.input.keyboard);
        derecha.reset();
        izquierda.reset();

    },

   
    update() {
        
        //Caida de los asteroides
        Phaser.Actions.IncY(asteroides.getChildren(), velocidadCaida);
        
        //Caida de las bolas de energia
        Phaser.Actions.IncY(bolasEnergia.getChildren(), velocidadCaida);
        
         //Caida de las vidas
         Phaser.Actions.IncY(corazonVida.getChildren(), velocidadCaida);
         

        //Reiniciando la velocidad de la nave
        nave.body.setVelocityX(0);  
        
         //si izquierda esta presionado
        if (izquierda.isDown) {  
            // restamos a la nave en X una velocidad de 800.
            nave.body.setVelocityX(-velocidadNave);   
        } // si derecha esta presionado
        else if (derecha.isDown) { 
            // agregamos una velocidad de 800 
            nave.body.setVelocityX(velocidadNave); 
        }
            
        if (Phaser.Input.Keyboard.JustDown(spacebar) && nave.municion > 0) {
            //peticion de bala al grupo de balas
            var bala = balas.get();   
            //si existe una bala disponible 
            if (bala) {
                sonidoDisparo.play();        //sonido disparo
                bala.fire(nave.x, nave.y);   // la bala se dispara de la nave
                nave.municion--;             // descuento de municion
                this.actualizarTexto();
            }
        }
    },


    generarAsteroides() {
                             //numero aleatorio entre el minAst. y el maxAst. 
        var numeroAsteroides = Phaser.Math.Between(minAsteroides, maxAsteroides);
        
       for (let i = 0; i < numeroAsteroides; i++) {  
            var asteroide = asteroides.get();

            if (asteroide) {
                asteroide.setActive(true).setVisible(true);
                asteroide.y = -100;
                asteroide.x = Phaser.Math.Between(0, game.config.width);

                //Overlap (colicion) entre 2 asteroides del juego 
                this.physics.add.overlap(asteroide, asteroides, (asteroideEnColicion) => {
                    asteroideEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
                
            }
            
            
        }
        //Variable numeroProbabilidad de bolas de energia
        var numeroProbabilidad = Phaser.Math.Between(1, 100);

        if (numeroProbabilidad <= probabilidadEnergia) { 
            var energia = bolasEnergia.get();   //

            if (energia) {          
                energia.setActive(true).setVisible(true);   // activar y aparecer la bola de energia
                energia.y = -100;
                energia.x = Phaser.Math.Between(0, game.config.width);

                //Overlap entre la energia y los asteroides2
                this.physics.add.overlap(energia, asteroides, (energiaEnColicion) => {
                    energiaEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });

            }
        }

        //Variable numeroProbabilidad de vida
        var numeroprobabilidadVida = Phaser.Math.Between(1, 100);
        if (numeroprobabilidadVida <= probabilidadVida) { 
            var vida = corazonVida.get();       

            if (vida) {          
                vida.setActive(true).setVisible(true);   // activar y aparecer el corazon de vida
                vida.y = -100;
                vida.x = Phaser.Math.Between(0, game.config.width);

                //Overlap entre la vida y los asteroides
                this.physics.add.overlap(vida, asteroides, (vidaEnColicion) => {
                    vidaEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
                
                
                //Overlap entre la vida y las bolas de energia
                this.physics.add.overlap(vida, bolasEnergia, (vidaEnColicion) => {
                    vidaEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
            }
        }
    },


    colisionNaveAsteroide(nave, asteroide) {
        if (asteroide.active) {
            asteroides.killAndHide(asteroide); //eliminar el asteroide que coliciono
            asteroide.setActive(false);        // desactivar el asteroide
            asteroide.setVisible(false);       //ocultar el asteroide
            damage.play();                     //sonido damage
            if (nave.vida > 0) {  
                nave.vida--;                // restando la vida de la nave
              if (nave.vida <= 0) {
                  this.finPartida();
                   
               }
            }
            this.actualizarTexto();
        }
    },

    colisionBalaAsteroide(bala, asteroide) {
        if (bala.active && asteroide.active) {  //Si ambos estan activos
            balas.killAndHide(bala);            //eliminar o quitar bala
            bala.setActive(false);              //desactivar la bala
            bala.setVisible(false);             //ocultar la bala
            asteroides.killAndHide(asteroide);  //eliminar o quitar asteroide
            asteroide.setActive(false);         //desactivar asteroide
            asteroide.setVisible(false);        //ocultar asteroide
            nave.score += puntuacionPorEliminacion;
            this.actualizarTexto();
        }
    },


    colisionNaveEnergia(nave, energia) {
        if (energia.active) {                   //si la energia esta activa
            bolasEnergia.killAndHide(energia);  //eliminar o quitar energia
            energia.setActive(false);           //desactivar la energia
            energia.setVisible(false);          //ocultar la energia
            recarga_energia.play();             //sonido recarga de energia
            nave.municion += municionPorEnergia; //suma de municion por energia
            this.actualizarTexto();              //actualizar texto
        }
    },

    colisionNaveVida(nave, vida) {
        if (vida.active) {                   //si la vida esta activa
            corazonVida.killAndHide(vida);  //eliminar o quitar vida
            vida.setActive(false);           //desactivar la vida
            vida.setVisible(false);          //ocultar la vida
            recarga_vida.play();             //sonido recarga de vida
            nave.vida += existenciaPorVida; //suma de existencia por vida
            this.actualizarTexto();              //actualizar texto
        }
    },

    

       //TEXTO
        actualizarTexto() {

        texto.setText('Vida: ' + nave.vida + '\nMunición: ' + nave.municion + '\nScore: ' + nave.score +
           '\nTiempo: ' + tiempo.minutos + ':' + tiempo.segundos);
    },
    
    actualizarContador() {
        tiempo.segundos++;
        tiempo.segundos = (tiempo.segundos >= 10) ? tiempo.segundos : '0' + tiempo.segundos;
        if (tiempo.segundos >= 60) {
            tiempo.segundos = '00';
            tiempo.minutos++;
            tiempo.minutos = (tiempo.minutos >= 10) ? tiempo.minutos : '0' + tiempo.minutos;
        }
        if (tiempo.segundos == 25){
                       this.scene.pause();
            setTimeout(() => {
            this.scene.stop();
            this.scene.start('Inicio2'); 
        }, 2000)

        }
       
        this.actualizarTexto();
    },

    finPartida() {
        this.add.text(game.config.width / 2, game.config.height / 2, 'Fin de la partida.', {
            fontSize: '50px',
            fill: 'red'
        }).setOrigin(0.5);
        tiempoUltimaPartida = tiempo;
        var nuevotiempo = parseInt(tiempo.minutos+tiempo.segundos);
        var mejortiempo = parseInt(tiempoMejorPartida.minutos + tiempoMejorPartida.segundos);
        if(nuevotiempo > mejortiempo){
            tiempoMejorPartida = tiempo;
        }
        this.scene.pause();
        setTimeout(() => {
            this.scene.stop();
            this.scene.start('Inicio'); 
        }, 2000)
    }

});

//VARIABLES
var fondoJuego2;
var nave2;
var derecha2;
var izquierda2;
var asteroides2;
var texto2;
var spacebar2;
var sonidoDisparo2;
var damage2;
var recarga_energia2;
var recarga_vida2;
var iniciar2; 

 //CONSTANTES
const vidanave2 = 5;
const municionInicial2 = 20;
const puntuacionInicial2 = 0;
const velocidadnave2 = 800;
const minasteroides2 = 2;
const maxasteroides2 = 4;
const velocidadCaida2 = 6;
const tiempo2Aparicion2 = 600;
const probabilidadEnergia2 = 10;
const municionPorEnergia2 = 5;
const probabilidadVida2 = 5;
const existenciaPorVida2 = 1;
const puntuacionPorEliminacion2 =3;

var tiempo2 = {
   minutos2: '00',
    segundos2: '00'
}

var tiempoUltimaPartida2 = tiempo2 ;
var tiempoMejorPartida2 = tiempo2;


//ESCENA INICIO2
var Inicio2 = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Inicio2() {
            Phaser.Scene.call(this, { key: 'Inicio2' });
        },

    create() {
        
        var texto2 = this.add.text(game.config.width / 2, game.config.height / 2, 'NIVEL_2', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5);
            setTimeout(() => {
            this.scene.stop();
            this.scene.start('Principal2'); 
        }, 2000)
            
        Nivel_2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        Nivel_2.reset();
    },

        update() {
        if (Nivel_2.isDown) {
            this.scene.start('Principal2');
        }
    }
});


//ESCENA PRINCIPAL2
var Principal2 = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Principal2() {
            Phaser.Scene.call(this, { key: 'Principal2' });
        },
        
    //Aqui recargaremos todos los recursos necesarios
    preload() {

        //importando imagenes
        this.load.image('fondo','assets/sprites/galaxia0.jpg')
        this.load.image('nave2', 'assets/sprites/nave0.png');
        this.load.image('asteroides2', 'assets/sprites/asteroides1.png');
        this.load.image('bala', 'assets/sprites/bala.png');
        this.load.image('energia', 'assets/sprites/energia.png');
        this.load.image('vida', 'assets/sprites/vida.png');
        //importando audios
        this.load.audio('sonidoDisparo2', 'assets/sonidos/disparo.wav');
        this.load.audio('damage2', 'assets/sonidos/damage.wav');
        this.load.audio('recarga_energia2', 'assets/sonidos/recarga_energia.wav');
        this.load.audio('recarga_vida2', 'assets/sonidos/recarga_vida.wav');
    },

    //Aqui es donde inicializaremos todos los elementos de nuestro video juego
    create() {
        fondoJuego2 =this.add.tileSprite (0, 0, 2500, 1200, 'fondo')
        
        //inicilizando el sprite nave2
        nave2 = this.physics.add.sprite(game.config.width / 2, game.config.height - 100, 'nave2')
        nave2.vida = vidanave2;
        nave2.municion = municionInicial2;
        nave2.score = puntuacionInicial2;
        nave2.setCollideWorldBounds(true);  //para que la nave2 no pueda salir del mundo
        
        //inicializando los sonidos en una variable
        sonidoDisparo2 = this.sound.add('sonidoDisparo2');
        damage2 = this.sound.add('damage2');
        recarga_energia2 = this.sound.add('recarga_energia2');
        recarga_vida2 = this.sound.add('recarga_vida2');


        texto2 = this.add.text(10, 10, '', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setDepth(0.1);
        this.actualizartexto2();

        // asteroides2
        asteroides2 = this.physics.add.group({   //grupo de asteroides2
            defaultKey: 'asteroides2',           // Key de asteroides2
            maxSize: 60     // cantidad de asteroides2 que podran estar cargados al mismo tiempo2
        });

        // BALAS
        balas = this.physics.add.group({   //grupo de balas
            classType: bala,         //clase que se utilizara
            maxSize: 20,            
            runChildUpdate: true
        });

        //BOLAS DE ENERGIA
        bolasEnergia = this.physics.add.group({  //grupo de energia
            defaultKey: 'energia',              //Key de Energia
            maxSize: 8                         //cantidad de energia que podran estar cargados al mismo tiempo2
        });
  
        //VIDA
        corazonVida = this.physics.add.group({  //grupo de vida
            defaultKey: 'vida',              //Key de vida
            maxSize: 3                       //cantidad de vida que podran estar cargados al mismo tiempo2
        });

        
        this.time.addEvent({
            delay: tiempo2Aparicion2,
            loop: true,                    //se repita una y otra vez
            callback: () => {
                this.generarasteroides2()  //evento que lanzara
            }
        });

    
       this.time.addEvent({
            delay: 1000,
            loop: true,                   //se repite una y otra vez
            callback: () => {
                this.actualizarContador2(); //evento que lanzara
            }
        });

        //Overlap (colicion) 
        this.physics.add.overlap(nave2, asteroides2, this.colisionnave2Asteroide, null, this);
        this.physics.add.overlap(balas, asteroides2, this.colisionBalaAsteroide, null, this);
        this.physics.add.overlap(nave2, bolasEnergia, this.colisionnave2Energia, null, this);
        this.physics.add.overlap(nave2, corazonVida, this.colisionnave2Vida, null, this);

        //CONTROLES DE TECLA
        derecha2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);  
        izquierda2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        spacebar2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        console.log(this.input.keyboard);
        derecha2.reset();
        izquierda2.reset();

    },

   
    update() {
        
        //Caida de los asteroides2
        Phaser.Actions.IncY(asteroides2.getChildren(), velocidadCaida2);
        
        //Caida de las bolas de energia
        Phaser.Actions.IncY(bolasEnergia.getChildren(), velocidadCaida2);
        

         //Caida de las vidas
         Phaser.Actions.IncY(corazonVida.getChildren(), velocidadCaida2);
        
        //Reiniciando la velocidad de la nave2
        nave2.body.setVelocityX(0);  
        
         //si izquierda2 esta presionado
        if (izquierda2.isDown) {  
            // restamos a la nave2 en X una velocidad de 800.
            nave2.body.setVelocityX(-velocidadnave2);   
        } // si derecha2 esta presionado
        else if (derecha2.isDown) { 
            // agregamos una velocidad de 800 
            nave2.body.setVelocityX(velocidadnave2); 
        }
            
        if (Phaser.Input.Keyboard.JustDown(spacebar2) && nave2.municion > 0) {
            //peticion de bala al grupo de balas
            var bala = balas.get();   
            //si existe una bala disponible 
            if (bala) {
                sonidoDisparo2.play();        //sonido disparo
                bala.fire(nave2.x, nave2.y);   // la bala se dispara de la nave2
                nave2.municion--;             // descuento de municion
                this.actualizartexto2();
            }
        }
    },


    generarasteroides2() {
                             //numero aleatorio entre el minAst. y el maxAst. 
        var numeroasteroides2 = Phaser.Math.Between(minasteroides2, maxasteroides2);
        
        for (let i = 0; i < numeroasteroides2; i++) {  
            var asteroide = asteroides2.get();

            if (asteroide) {
                asteroide.setActive(true).setVisible(true);
                asteroide.setFrame(Phaser.Math.Between(0, 1));
                asteroide.y = -100;
                asteroide.x = Phaser.Math.Between(0, game.config.width);

                //Overlap (colicion) entre 2 asteroides2 del juego 
                this.physics.add.overlap(asteroide, asteroides2, (asteroideEnColicion) => {
                    asteroideEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
            }
        }
        
        //Variable numeroProbabilidad de bolas de energia
        var numeroProbabilidad = Phaser.Math.Between(1, 100);

        if (numeroProbabilidad <= probabilidadEnergia2) { 
            var energia = bolasEnergia.get();   //

            if (energia) {          
                energia.setActive(true).setVisible(true);   // activar y aparecer la bola de energia
                energia.y = -100;
                energia.x = Phaser.Math.Between(0, game.config.width);

                //Overlap entre la energia y los asteroides2
                this.physics.add.overlap(energia, asteroides2, (energiaEnColicion) => {
                    energiaEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });

            }
        }

        //Variable numeroProbabilidad de vida
        var numeroprobabilidadVida2 = Phaser.Math.Between(1, 100);
        if (numeroprobabilidadVida2 <= probabilidadVida2) { 
            var vida = corazonVida.get();       //

            if (vida) {          
                vida.setActive(true).setVisible(true);   // activar y aparecer el corazon de vida
                vida.y = -100;
                vida.x = Phaser.Math.Between(0, game.config.width);

                //Overlap entre la vida y los asteroides2
                this.physics.add.overlap(vida, asteroides2, (vidaEnColicion) => {
                    vidaEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
                
                
                //Overlap entre la vida y las bolas de energia
                this.physics.add.overlap(vida, bolasEnergia, (vidaEnColicion) => {
                    vidaEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
            }
        }
    },


    colisionnave2Asteroide(nave2, asteroide) {
        if (asteroide.active) {
            asteroides2.killAndHide(asteroide); //eliminar el asteroide que coliciono
            asteroide.setActive(false);        // desactivar el asteroide
            asteroide.setVisible(false);       //ocultar el asteroide
            damage2.play();                     //sonido damage2
            if (nave2.vida > 0) {  
                nave2.vida--;                // restando la vida de la nave2
              if (nave2.vida <= 0) {
                  this.finPartida();
                   
               }
            }
            this.actualizartexto2();
        }
    },

    colisionBalaAsteroide(bala, asteroide) {
        if (bala.active && asteroide.active) {  //Si ambos estan activos
            balas.killAndHide(bala);            //eliminar o quitar bala
            bala.setActive(false);              //desactivar la bala
            bala.setVisible(false);             //ocultar la bala
            asteroides2.killAndHide(asteroide);  //eliminar o quitar asteroide
            asteroide.setActive(false);         //desactivar asteroide
            asteroide.setVisible(false);        //ocultar asteroide
            nave2.score += puntuacionPorEliminacion2;
            this.actualizartexto2();
        }
    },


    colisionnave2Energia(nave2, energia) {
        if (energia.active) {                   //si la energia esta activa
            bolasEnergia.killAndHide(energia);  //eliminar o quitar energia
            energia.setActive(false);           //desactivar la energia
            energia.setVisible(false);          //ocultar la energia
            recarga_energia2.play();             //sonido recarga de energia
            nave2.municion += municionPorEnergia2; //suma de municion por energia
            this.actualizartexto2();              //actualizar texto2
        }
    },

    colisionnave2Vida(nave2, vida) {
        if (vida.active) {                   //si la vida esta activa
            corazonVida.killAndHide(vida);  //eliminar o quitar vida
            vida.setActive(false);           //desactivar la vida
            vida.setVisible(false);          //ocultar la vida
            recarga_vida2.play();             //sonido recarga de vida
            nave2.vida += existenciaPorVida2; //suma de existencia por vida
            this.actualizartexto2();              //actualizar texto2
        }
    },

       //texto2
        actualizartexto2() {

        texto2.setText('Vida: ' + nave2.vida + '\nMunición: ' + nave2.municion +  '\nScore: ' + nave2.score+
           '\ntiempo: ' + tiempo2.minutos2 + ':' + tiempo2.segundos2);
    },
    
    actualizarContador2() {
        tiempo2.segundos2++;
        tiempo2.segundos2 = (tiempo2.segundos2 >= 10) ? tiempo2.segundos2 : '0' + tiempo2.segundos2;
        if (tiempo2.segundos2 >= 60) {
            tiempo2.segundos2 = '00';
            tiempo2.minutos2++;
            tiempo2.minutos2 = (tiempo2.minutos2 >= 10) ? tiempo2.minutos2 : '0' + tiempo2.minutos2;
         }
        if (tiempo2.segundos2 == 28){
            this.scene.pause();
            setTimeout(() => {
             this.scene.stop();
            this.scene.start('FinPartida'); 
            }, 2000)

            }

        this.actualizartexto2();
    },

    finPartida() {
        this.add.text(game.config.width / 2, game.config.height / 2, 'Fin de la Partida.', {
            fontSize: '50px',
            fill: 'red'
        }).setOrigin(0.5);
        tiempoUltimaPartida2 = tiempo2;
        var nuevotiempo2 = parseInt(tiempo2.minutos2+tiempo2.segundos2);
        var mejortiempo2 = parseInt(tiempoMejorPartida2.minutos2 + tiempoMejorPartida2.segundos2);
        if(nuevotiempo2 > mejortiempo2){
            tiempoMejorPartida2 = tiempo2;
        }
        this.scene.pause();
        setTimeout(() => {
            this.scene.stop();
            this.scene.start('Inicio'); 
        }, 2000)
    }

    }); 

    
//ESCENA FIN PARTIDA
var FinPartida = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function FinPartida() {
            Phaser.Scene.call(this, { key: 'FinPartida' });
        },

    create() {
        
        var texto2 = this.add.text(game.config.width / 2, game.config.height / 2, '¡GANASTE..!', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5);
            setTimeout(() => {
            this.scene.stop();
            this.scene.start('Inicio'); 
        }, 2000)
            
        FinPartida = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        FinPartida.reset();
    },

        update() {
        if (FinPartida.isDown) {
            this.scene.start('Inicio');
        }
    }
});

 

 //OBJETO DE CONFIGURACION
var config = {
    type: Phaser.AUTO,  
    width: 1200,
    height: 600,
    backgroundColor: 'black',
    parent: 'Juego_nave',       // Es asi como la ID
    physics: {                  //Fisicas
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },  //Gravedad en cero (no lo utilizaremos)
            debug: false
        }
    },
    scene: [Inicio, Principal, Inicio2, Principal2,FinPartida]
};

//Instancia de nuestro video juego
var game = new Phaser.Game(config); 