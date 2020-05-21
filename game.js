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
var iniciar; 

 //CONSTANTES
const vidaNave = 4;
const municionInicial = 10;
const velocidadNave = 800;
const minAsteroides = 2;
const maxAsteroides = 4;
const velocidadCaida = 5;
const tiempoAparicion = 600;
const probabilidadEnergia = 20;
const municionPorEnergia = 5;

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
            '\nMejor tiempo: ' + tiempoMejorPartida.minutos + ':' + tiempoMejorPartida.segundos, {
                fontSize: '20px',
                fill: '#ffffff'
            });

        var texto = this.add.text(game.config.width / 2, game.config.height / 2, 'Iniciar', {
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
        //importando audios
        this.load.audio('sonidoDisparo', 'assets/sonidos/disparo.wav');
        this.load.audio('damage', 'assets/sonidos/damage.wav');
        this.load.audio('recarga_energia', 'assets/sonidos/recarga_energia.wav');
    },

    //Aqui es donde inicializaremos todos los elementos de nuestro video juego
    create() {
        fondoJuego =this.add.tileSprite (0, 0, 2500, 1200, 'fondo')
        
        //inicilizando el sprite NAVE
        nave = this.physics.add.sprite(game.config.width / 2, game.config.height - 100, 'nave')
        nave.vida = vidaNave;
        nave.municion = municionInicial;
        nave.setCollideWorldBounds(true);  //para que la nave no pueda salir del mundo
        
        //inicializando los sonidos en una variable
        sonidoDisparo = this.sound.add('sonidoDisparo');
        damage = this.sound.add('damage');
        recarga_energia = this.sound.add('recarga_energia');


        texto = this.add.text(10, 10, '', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setDepth(0.1);
        this.actualizarTexto();

        // ASTEROIDES
        asteroides = this.physics.add.group({   //grupo de asteroides
            defaultKey: 'asteroides',           // Key de asteroides
            frame: 0,
            maxSize: 10       // cantidad de asteroides que podran estar cargados al mismo tiempo
        });

        // BALAS
        balas = this.physics.add.group({   //grupo de balas
            classType: bala,         //clase que se utilizara
            maxSize: 10,            
            runChildUpdate: true
        });

        //BOLAS DE ENERGIA
        bolasEnergia = this.physics.add.group({  //grupo de energia
            defaultKey: 'energia',              //Key de Energia
            maxSize: 20                         //cantidad de energia que podran estar cargados al mismo tiempo
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
        asteroides.children.iterate(function (asteroide) {
            if (asteroide.y > 600) {
                asteroides.killAndHide(asteroide);
            }
        });

        //Caida de las bolas de energia
        Phaser.Actions.IncY(bolasEnergia.getChildren(), velocidadCaida);
        bolasEnergia.children.iterate(function (energia) {
            if (energia.y > 600) {
                bolasEnergia.killAndHide(energia);
            }
        });

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
                asteroide.setFrame(Phaser.Math.Between(0, 1));
                asteroide.y = -100;
                asteroide.x = Phaser.Math.Between(0, game.config.width);

                //Overlap (colicion) entre 2 asteroides del juego 
                this.physics.add.overlap(asteroide, asteroides, (asteroideEnColicion) => {
                    asteroideEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
            }
        }
        
        //Variable numeroProbabilidad
        var numeroProbabilidad = Phaser.Math.Between(1, 100);

        if (numeroProbabilidad <= probabilidadEnergia) { 
            var energia = bolasEnergia.get();   //

            if (energia) {          
                energia.setActive(true).setVisible(true);   // activar y aparecer la bola de energia
                energia.y = -100;
                energia.x = Phaser.Math.Between(0, game.config.width);

                //Overlap entre la energia y los asteroides
                this.physics.add.overlap(energia, asteroides, (energiaEnColicion) => {
                    energiaEnColicion.x = Phaser.Math.Between(0, game.config.width);
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

       //TEXTO
        actualizarTexto() {

        texto.setText('Vida: ' + nave.vida + '\nMunición: ' + nave.municion +
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
        this.actualizarTexto();
    },

    finPartida() {
        this.add.text(game.config.width / 2, game.config.height / 2, 'Fin de la partida.', {
            fontSize: '50px',
            fill: 'red'
        }).setOrigin(0.5);
        tiempoUltimaPartida = tiempo;
        var nuevoTiempo = parseInt(tiempo.minutos+tiempo.segundos);
        var mejorTiempo = parseInt(tiempoMejorPartida.minutos + tiempoMejorPartida.segundos);
        if(nuevoTiempo > mejorTiempo){
            tiempoMejorPartida = tiempo;
        }
        this.scene.pause();
        setTimeout(() => {
            this.scene.stop();
            this.scene.start('Inicio'); 
        }, 2000)
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
    scene: [Inicio, Principal]
};

//Instancia de nuestro video juego
var game = new Phaser.Game(config); 