//esta parte corresponde al script donde encontraremos las validaciones para acceder
var g_ventanapopupbi;
$(document).ready(function () {
	
	$(document).on('bbva.login.load',function(a,b,c){
		initFormElement();
	});
	
	$(document).on('click', '.modal-parent', function(e){
		var URL = $(this).attr('href');
		var minHeight = $(this).data('modal-height')==undefined?300:$(this).data('modal-height');
		var title = ''; // optional title attribute of the iframe (accessibility only)
		window.parent.postMessage(['[bbva.modal]', URL, minHeight, title].join('|'), "*");
		return false;
	});	
	
	function initFormElement(){
		$('input[type="text"], input[type="password"]').each(function(i,e){
			$(e).on("focus", function(){
				addHasValue($(this));
//				if(!$(this).hasClass('has-value')){
//					$(this).addClass('has-value')
//				}
			}).on('blur', function(){
				removeHasValue($(this));
//				if($(this).val()===""){
//					$(this).removeClass('has-value');
//				}
			});
		})
	}
	
	var tip = tippy('.tippy');

	inicializaComboTipoDocumento();
	$("#txteai_password").keyup(function (e) {
		if (e.which == 13) {
			e.preventDefault();
			$("#btnEntrar").trigger("click");
		} else {
			$("#eai_password").val($("#txteai_password").val());
		}
	});
	
	$("#icon_password").click(function(){
		if ($("#txteai_password").attr("type") == "password") {
			$("#txteai_password").attr("type", "text");
			$( "#icon_password" ).removeClass("mostrarPassword").addClass("ocultarPassword");
		} else {
			$("#txteai_password").attr("type", "password");
			$("#icon_password").removeClass("ocultarPassword").addClass( "mostrarPassword" );
		}
	 });

	$("#btnEntrar").click(function () {
		$('#eai_user').val($("#tipo-documento").val()+$('#txteai_user').val());
		$(this).data('attr-alias',$("#txtAliasTarjeta").val());
		if (validarLogin()) { //valida si los campos son correctos
			var parametros_adicionales_url = obtenerParametroAdicionalParent('dpl_cod_prod');
			if(parametros_adicionales_url === undefined || parametros_adicionales_url === 'undefined'){
				parametros_adicionales_url = '';
			}
			if ($("#chkFrecuentes").attr("checked")){ //almacenara nuevo valor en la cookie si esta seleccionado tarjeta frecuente
				var v_PAN = $('#eai_user').val();
				var str = v_PAN.substring(0,1)+v_PAN.substring(v_PAN.length-4);
				var v_Alias = $('#txtAliasTarjeta').val();
				var v_alias_pad=v_Alias;
				if(v_Alias.length<8){
					v_alias_pad = pad(v_Alias, 8);
				}else if(v_Alias.length> 8 && v_Alias.length < 16){
					v_alias_pad =pad(v_Alias, 16);
				}
				v_alias_pad=v_alias_pad+str;
				/**Solo declaracion de variables*/
                var keyCifrado = '';
                var keyCifradoCookie ='';
			    var index = 0;
                var isNew = 0;
		  		dataValidaAlias();
		  		var storeData = null;
				if ( $.cookie("BBVACookies3") != undefined )
					storeData=JSON.parse($.cookie("BBVACookies3"));	
		  		var saveCookie = 0;
		  		keyCifrado = getKeyServlet(v_PAN,v_alias_pad,'',0); //ciframos la tarjeta antes de realizar operaciones
				
		  		if(keyCifrado!=''){
					keyCifradoCookie = cadenaTimestamp() + v_Alias+str + '_' + keyCifrado + '_1';
					var sDataTam = storeData==null?0:storeData.length;//agregador por db6
					var newitem = "1";
					if(storeData  == null || sDataTam == 0){//validamos si existe la cookie pero esta vacia  o no existe para crearla
						storeData = new Array();
						storeData.push(keyCifradoCookie);
						//saveCookie = 1;
						//solo agregamos la tarjeta a la cookie no validamos nada porque es el primer valor
						$.cookie("BBVACookies3", JSON.stringify(storeData),{ expires: 730, path:'/', domain:'.bbva.pe' });		//el tiempo de vida de la cookie sera 2 anios	
						//guardar en lista general de tarjetas
						var existia = agregarHistorialCC(v_PAN,$('#txtAliasTarjeta').val(),keyCifrado);
						$("#eai_URLDestino").val("/bdntux_pe_web/bdntux_pe_web/?action=index" + parametros_adicionales_url);	//variable de envio de correo	
						//alert($("#eai_URLDestino").val());//comentar
						$("#eai_user").val($("#eai_user").val().replace(/[/]/g, "-SL"));
						
						setCookieMPFingerprintV2();

						$("#formLogin").submit();
						$("#eai_user").val("");
						$("#txteai_password").val("");
						$("#txtAliasTarjeta").val("");
						$("#txteai_user").val("");
						loadInitial();
						$("#frectar").trigger("change");
						cerrarLogin();
						return;
					}else{
						//agregaremos la tarjeta a la cookie
						for (var i = 0; i < storeData.length; i++) {
							var item = storeData[i];
							var idxIni = item.indexOf('_') ;
							var idxEnd = item.lastIndexOf('_');
							var keyC = item.substr(idxIni + 1,idxEnd - idxIni - 1);
							var v_Alias_t = item.substring(10,idxIni-4);
							//Validamos si se actualizaro un alias o se agrega la tarjeta
							var eq = v_Alias_t.localeCompare(v_Alias);
							if(eq == 0){
								for (var j = 0; j < storeData.length; j++) {
									var itemAux = storeData[j];
									storeData[j] = itemAux.replace("_1", "_0");
								}
								storeData[i] = keyCifradoCookie;
								newitem = "0"
							}
						}
						if (newitem =="1")
							storeData.push(keyCifradoCookie);
					
						var valFrectar=$("#frectar").val();

						//var v_expires = 365 * 24 * 60 * 60 * 2;
						$.cookie("BBVACookies3", JSON.stringify(storeData),{ expires: 730, path:'/', domain:'.bbva.pe' });	//el tiempo de vida de la cookie sera 2 anios	
						//guardar en lista general de tarjetas
						var existia = agregarHistorialCC(v_PAN,$('#hdfAliasTarjeta').val(),keyCifrado);
						$("#eai_URLDestino").val("/bdntux_pe_web/bdntux_pe_web/?action=index" + parametros_adicionales_url); //variable de envio de correo
						//alert($("#eai_URLDestino").val());//comentar
						$("#eai_user").val($("#eai_user").val().replace(/[/]/g, "-SL"));
						
						setCookieMPFingerprintV2();
						
						$("#formLogin").submit();
						$("#eai_user").val("");
						$("#txteai_password").val("");
						$("#txtAliasTarjeta").val("");
						$("#txteai_user").val("");
						loadInitial(); 
						$("#frectar").trigger("change");
						cerrarLogin();
					}
				}else{
					g_ventanapopupbi.close();
				}
				
			}else{ //aqui ingresa si no tiene marcado el check como frecuente
				var tarjetaDescrifrado;
				var tarjCif = '';
				var existia = false;
				var frecuente = false;
				var valorCbx=$("#frectar").val();
				if (valorCbx == null || valorCbx == 1 || valorCbx == '' ){ //no hemos seleccionado ninguna tarjeta frecuente solo ingresamos el numero de tarjeta
					tarjetaDescrifrado = $("#eai_user").val();
					//alert($("#eai_URLDestino").val());//comentar
				}
				else {	//hemos seleccionado una tarjeta frecuente y por lo tanto debemos descifrar y almacenar como ultimo seleccionado
					frecuente = true;
					existia = true;
					var idxIni = valorCbx.indexOf('_') ;
					var idxEnd = valorCbx.lastIndexOf('_');
					var varLenght = valorCbx.length;
					var valorx = valorCbx.substr(idxIni + 1,idxEnd - idxIni - 1);
					tarjCif = valorx;
					tarjetaDescrifrado = getKeyServlet('','',tarjCif,1);
					var aliasCbo = $("#frectar option:selected").text();
					var indexAliasCbo = tarjetaDescrifrado.substr(11).indexOf(aliasCbo.replace(/ /g,'%20'));
					var alias = tarjetaDescrifrado.substr(11,indexAliasCbo);
					if(tarjetaDescrifrado!=''){
						var storeData =null;
						if ( $.cookie("BBVACookies3") != undefined )
							storeData=JSON.parse($.cookie("BBVACookies3"));
						var sDataTam = storeData==null?0:storeData.length;//db6
						if(storeData  != null || sDataTam > 0){//modificado por db6
							for (var j = 0; j < storeData.length; j++) {
								var itemAux = storeData[j];
								storeData[j] = itemAux.replace("_1", "_0");
								var valFrectarAux=$("#frectar").val();
								if (escape(itemAux) ==  valFrectarAux){
									storeData[j] = itemAux.replace("_0", "_1");
								}
							}
							//almacenamos la tarjeta con el indice de la ultima tarjeta seleccionada 
							$.cookie("BBVACookies3", JSON.stringify(storeData),{ expires: 730, path:'/', domain:'.bbva.pe' }); //el tiempo de vida de la cookie sera 2 anios
							//alert($("#eai_URLDestino").val());//comentar
						}
						$("#eai_user").val(alias);
					}else{
						g_ventanapopupbi.close();
					}
				}
				
				if(tarjetaDescrifrado!=''){
					//alert("num tarjeta: " + $("#eai_user").val()); //comentar
					if(!frecuente){
						//guardar en lista general de tarjetas
						existia = agregarHistorialCC($("#eai_user").val(),$('#hdfAliasTarjeta').val(),'');
					}
					$("#eai_URLDestino").val("/bdntux_pe_web/bdntux_pe_web/?action=index" + parametros_adicionales_url);
					$("#eai_user").val($("#eai_user").val().replace(/[/]/g, "-SL"));
										
					setCookieMPFingerprintV2();
						
					$("#formLogin").submit();
					if(frecuente){
						//restaura el codigo del alias seleccionado
						$("#eai_user").val(tarjCif);
					}
					//agregado db6
					 var ft = $("#frectar");
					 var fto = $("#frectar option");
					 //actualizamos la visualizacion del login
					if(ft.length>0&&fto.length>0){
						if(!($("#frectar option:selected").length>0)||$("#frectar").val()=="1"){
							$("#txteai_user").val("");
							$("#txteai_user").focus();//db6_9
							$("#chkFrecuentes").attr("checked", true);//de6_10
							$("#chkFrecuentes").prop("checked", true);//de6_10
							$("#divTxtAliasTarjeta").show();
							$("#txtAliasTarjeta").css("display", "block");//de6_10
						}else{		                
							$("#txteai_password").focus();//db6_9
						}
					}else{
						$("#txteai_user").val("");
						$("#txteai_user").focus();//db6_9	
					}
					var storeData = null;
					if ( $.cookie("BBVACookies3") != undefined )
						storeData=JSON.parse($.cookie("BBVACookies3"));
					var sDataTam = storeData==null?0:storeData.length;//db6					
					if(sDataTam==0){
						$("#chkFrecuentes").attr("checked", false);//de6_10
						$("#chkFrecuentes").prop("checked", false);
						$("#chkFrecuentes").removeAttr("checked");
						$("#divTxtAliasTarjeta").hide();
						$("#txtAliasTarjeta").css("display", "none");//de6_10
					}
					//Limpia los valores del campo tarjeta y contrasenia para que no se queden almacenados luego del login
					$("#txteai_password").val("");
					$("#txtAliasTarjeta").val("");
					cerrarLogin();
				}
			}
		} else {
			g_ventanapopupbi.close();
		}
	});

	 $("#chkFrecuentes").change(function() { //controla los eventos del check
		if(this.checked) {
		   $("#chkFrecuentes").attr("checked", true);
		   $("#chkFrecuentes").prop("checked", true);
		   $("#divTxtAliasTarjeta").show();
		   $("#txtAliasTarjeta").css("display", "block");//de6
		   $("#txtAliasTarjeta").focus();
		}else{
		   $("#chkFrecuentes").attr("checked", false);
		   $("#chkFrecuentes").prop("checked", false);
		   $("#chkFrecuentes").removeAttr("checked");
		   $("#divTxtAliasTarjeta").hide();
		   $("#txtAliasTarjeta").css("display", "none");
		}
	});
	
	 $("#frectar" ).change(function() { //controla los eventos del combo
         var value = $( "#frectar" ).val();
         if(value=="1"){
         	  isFrectarIgual_1(); //se ejecuta si el combo no tiene seleccionado ninguna tarjeta frecuente
          }else{        		
        		  isFrectarIgual_0();//se ejecuta si el combo tiene seleccionado ninguna tarjeta frecuente
        		
        		var valueCookie = $( "#frectar" ).val();
				var idxIni = valueCookie.indexOf('_') ;
				var idxEnd = valueCookie.lastIndexOf('_');
				var varLenght = valueCookie.length;
				var keyCifrado = valueCookie.substr(idxIni + 1,idxEnd - idxIni - 1);
				var alias=valueCookie.substring(10,idxIni);
	  			var n = alias.substring(alias.length-5, alias.length);
	  			var codigoDocumentoIdentidad =  n.substring(0,1);
	  			alias  = alias.substring(0,alias.length-5);
	  			
	  			var longitudOculto= 0;
				if(codigoDocumentoIdentidad == 'L')
					longitudOculto=4;
				else if(codigoDocumentoIdentidad == 'R')
					longitudOculto=7;
				else if(codigoDocumentoIdentidad == 'P'||codigoDocumentoIdentidad == 'E')
					longitudOculto=8;
				else if(codigoDocumentoIdentidad == 'M'||codigoDocumentoIdentidad == 'D'||codigoDocumentoIdentidad == 'J')
					longitudOculto=11;
				$("#tipo-documento option").remove();
				$("#tipo-documento").append("<option value='L'>DNI</option>");
				$("#tipo-documento").append("<option value='R'>RUC</option>");
				$("#tipo-documento").append("<option value='P'>Pasaporte</option>");
				$("#tipo-documento").append("<option value='E'>Carnet de Extranjer&iacute;a</option>");
				$("#tipo-documento").append("<option value='M'>Carnet Identidad Militar</option>");
				$("#tipo-documento").append("<option value='D'>Carnet Diplom&aacute;tico</option>");
				$("#tipo-documento").append("<option value='J'>Partida de Nacimiento</option>");
					 
				$("#tipo-documento option[value='"+codigoDocumentoIdentidad+"']").attr('selected', true);
				$("#tipo-documento").trigger("change");
				$("#txteai_user").addClass('has-value');
				$("#txteai_user").val(leftpad(n.substring(1), longitudOculto+n.length,"*"));	
				$("#eai_user").val(keyCifrado);
				$("#hdfAliasTarjeta").val(alias);
				$("#txteai_password").val("");	
				$("#chkBorrar").prop("checked", false);
         }
	  });
		  
     $("#chkBorrar" ).change(function(){ //check activo para borrar tarjeta frecuente
       	if(this.checked) {     
       		 $('#overlay_bloqueo').addClass('modal-backdrop in');
       		 $('#overlay_bloqueo').show();
             $("#openModalBorrar").css("display", "inline");    		
       	}else{
       		 $('#overlay_bloqueo').removeClass('modal-backdrop in')
	  	 	 $('#overlay_bloqueo').hide();
       		 $("#openModalBorrar").css("display", "none");  
       	}
    });
     
    $("#txtAliasTarjeta").change(function() {
		 $('#hdfAliasTarjeta').val(this.value);
	});
    
    $("#btnAceptarBorrarP").click(function(){ //cuando presionas aceptar borrar una tarjeta frecuente
        $("#openModalBorrar").css("display", "none");
        $('#overlay_bloqueo').hide();
  		$("#chkBorrar").prop("checked", true);
		var valueOption = unescape($( "#frectar" ).val());
		var data = null;
		if ( $.cookie("BBVACookies3") != undefined )
			data=JSON.parse($.cookie("BBVACookies3"));
		//funcion para buscar un valor en la cadena Json
		data = jQuery.grep(data, function(value) {
				return value != valueOption;
		});
						
		$.cookie("BBVACookies3", JSON.stringify(data),{ expires: 730, path:'/', domain:'.bbva.pe' });
		$('#frectar :selected').remove(); 
		
		var value = $( "#frectar" ).val();

    	 if(value=="1" ){ //valida el si queda algun valor en el combo, por si eliminamos todo los valores para hacer visible o no los controles necesarios          
    		isFrectarIgual_1();
    	 }else{
    		isFrectarIgual_0();
   		 }
   		 $("#chkBorrar").prop("checked", false);
   		 $("#chkFrecuentes").attr("checked", false);
   		 $("#chkFrecuentes").prop("checked", false);
   		 $("#chkFrecuentes").removeAttr("checked");
   		 
   		 var storeData = null;
		 if ( $.cookie("BBVACookies3") != undefined )
			storeData=JSON.parse($.cookie("BBVACookies3"));
   		 for (var j = 0; j < storeData.length; j++) {
	    			var itemAux = storeData[j];
	    			storeData[j] = itemAux.replace("_1", "_0");
		}
		//Actualizamos la cookie con fecha actual para que quede mas tiempo en el navegador.
		$.cookie("BBVACookies3", JSON.stringify(storeData),{ expires: 730, path:'/', domain:'.bbva.pe' }); //el tiempo de vida de la cookie sera 2 anios
		//abrimos nuevamente por si se elimino todas las tarjetas del combo y ya no necesita mostrar algunos campos	
   		 loadInitial();
    });
    
    $("#btnCancelarBorrarP").click(function(){
		$("#openModalBorrar").css("display", "none");
		$('#overlay_bloqueo').hide();
		$("#chkBorrar").prop("checked", false); 
		$("#txteai_password").focus();//db6_9
     });
    
    $('.form-control').on('keyup change vclick', function() {
		cleanElementError($(this));
    });
    
	loadInitial();	
	loadScript(function (){cdApi.resetSessionNumber('BI');cdApi.changeContext('LOGIN');},true);	
});

var cleanElementError = function($element) {
	// text, datepicker
	if ($element.hasClass('validation-invalid')) {
		$element.removeClass('validation-invalid');
		$('.validation-error',$element.parent()).hide();
	}
	if ($element.hasClass('inline-validation-invalid')) {
		$element.removeClass('inline-validation-invalid');
	}
	
	if ($element.is('input[type=checkbox]')) {
		if($element.parent().is('label')){
			$element.parent().removeClass('validation-invalid');
			$('.validation-error', $element.parent().parent()).hide();
		}		
	}
};

var addHasValue = function($element){
	if(!$element.hasClass('has-value')){
		$element.addClass('has-value')
	}
}

var removeHasValue = function($element){
	if($element.val()===""){
		$element.removeClass('has-value');
	}
}

function cadenaTimestamp() {
	return (new Date().getTime()) / 1000 | 0;
};

function validarLogin() { //valida los campos ingresados
	var v_retorno=true;
    var pValido=$("#frectar").css("display");
    var valFrectar=$("#frectar").val();
	var v_PAN = $('#eai_user').val();
	var v_PAN_length = v_PAN.length;
	var v_Alias = $('#hdfAliasTarjeta').val();

	var $txteai_password = $('#txteai_password');
	if(pValido=='none' || valFrectar==1 ){
		var $codigoDocumentoIdentidad = $("#txteai_user");
		if ($codigoDocumentoIdentidad.val().localeCompare("") == 0) {
			$codigoDocumentoIdentidad.data("msg", "Ingrese un n&uacute;mero de documento.").focus();
			showError($codigoDocumentoIdentidad);
			return false;
		} else {
			var minLength = $codigoDocumentoIdentidad.attr("minLength");
			if ($codigoDocumentoIdentidad.val().length < parseInt(minLength)) {
				var msg = "El n\u00famero de documento debe tener " + minLength;
				if ($codigoDocumentoIdentidad.hasClass("numero"))
					msg = msg + " d&iacute;gitos.";
				else if ($codigoDocumentoIdentidad.hasClass("alfanumerico-tipox"))
					msg = msg + " caracteres como m&iacute;nimo.";
				$codigoDocumentoIdentidad.data("msg", msg).focus();
				showError($codigoDocumentoIdentidad);
				return false;
			} else {
				var expresionRegular = new RegExp($codigoDocumentoIdentidad.attr("custom-pattern"));
				if (!expresionRegular.test($codigoDocumentoIdentidad.val())) {
					$codigoDocumentoIdentidad.data("msg", "Ingrese un n&uacute;mero de documento v&aacute;lido.").focus();
					showError($codigoDocumentoIdentidad);
					return false;
				}
			}
		}

		if ($txteai_password.val().localeCompare("") == 0) {
			$txteai_password.data("msg", "Ingrese contrase&ntilde;a").focus();
			showError($txteai_password);
			return false;
		}else if ($txteai_password.val().length <6 ){
			$txteai_password.data("msg", "Ahora tu contrase&ntilde;a debe tener m&iacute;nimo 6 caracteres, actual&iacute;zala haciendo clic ");
			$txteai_password.data("msg-2", "aqu&iacute;.").focus();
			showError2($txteai_password);
			return false;
		}else if ($("#chkFrecuentes").attr("checked")){
			var txtAliasTarjeta = $('#txtAliasTarjeta').val();
			if(txtAliasTarjeta.localeCompare("")==0 || $.trim(txtAliasTarjeta).length == 0){
				//alert("Debes ingresar un alias para recordar tu tarjeta");
				$("#txtAliasTarjeta").addClass('validation-invalid');
				toolk_4(); //mensaje de alerta error en campo
				$("#txtAliasTarjeta").focus();//db6_10op			  				
			return false;
			//v_retorno= false;	  
			}
		}

		var $tipoDocumento = $("#tipo-documento");
		var opcionesTipoDocumento = ["L", "R","P", "E", "M", "D", "J","X"];
		if(opcionesTipoDocumento.indexOf($tipoDocumento.val())<0){
			$codigoDocumentoIdentidad.data("msg", "Seleccione un tipo de documento de indentidad").focus();
			showError($codigoDocumentoIdentidad);
			return false;
		}
		
		if($('#eai_user').val()!=($tipoDocumento.val()+$codigoDocumentoIdentidad.val())){
			$codigoDocumentoIdentidad.data("msg", "Seleccione un tipo de documento de indentidad").focus();
			showError($codigoDocumentoIdentidad);
			return false;
		}
	}else{
		if($txteai_password.val().localeCompare("")==0){
			$txteai_password.data("msg", "Ingrese contrase&ntilde;a").focus();
			showError($txteai_password);
			return false;
  		}else if ($txteai_password.val().length <6 ){
			$txteai_password.data("msg", "Ahora tu contrase&ntilde;a debe tener m&iacute;nimo 6 caracteres, actual&iacute;zala haciendo clic ").focus();
			$txteai_password.data("msg-2", "aqu&iacute;.");
			showError2($txteai_password);
			return false;
		}
	} 
	return v_retorno;
};


function agregarHistorialCC(numCC,alias,numCifrado){
	var keyCifrado1;
	var keyCifrado2;
	var generico = false;
	var existeAlias = false;
	var existeGenerico = false;
	var cookies4=$.cookie("BBVACookies4");
	var data=null;
	if( cookies4 != undefined )
		data=JSON.parse($.cookie("BBVACookies4"));
	var sAlias = alias;
	var cuatroUlt = numCC.substring(numCC.length-4);
	//2 cifrados (con y sin alias)
	if(sAlias==''){
		generico = true;
		sAlias = 'generico'+cuatroUlt;
	}else{
		generico = false;
		sAlias = pad(sAlias, 8)+cuatroUlt;
	}
	
	if(generico){
		//no hay alias, usar generico
		keyCifrado1 = getKeyServlet(numCC,'generico'+cuatroUlt,'',0);
		keyCifrado2 = keyCifrado1;
	}else{
		//invocar para alias (o reciclar si ya se tiene) y generico
		if(numCifrado!=''){
			keyCifrado1 = numCifrado;
		}else{
		keyCifrado1 = getKeyServlet(numCC,sAlias,'',0);
		}
		keyCifrado2 = getKeyServlet(numCC,'generico'+cuatroUlt,'',0);
	}
	
	if(data==null){
		data = [];
	}
	
	existeAlias = existeHistorialCC(keyCifrado1);
	existeGenerico = existeHistorialCC(keyCifrado2);
	if(!existeAlias){
		var tarjeta = new Object();
		tarjeta.id = keyCifrado1;
		tarjeta.ts = cadenaTimestamp();
		data.push(tarjeta);
		$.cookie("BBVACookies4", JSON.stringify(data),{ expires: 730, path:'/', domain:'.bbva.pe' });
	}
	if(!generico && !existeGenerico){
		var tarjeta = new Object();
		tarjeta.id = keyCifrado2;
		tarjeta.ts = cadenaTimestamp();
		data.push(tarjeta);
		$.cookie("BBVACookies4", JSON.stringify(data),{ expires: 730, path:'/', domain:'.bbva.pe' });
	}
	
	return (existeAlias || existeGenerico);
  }

function existeHistorialCC(numCC){
	var cookies4=$.cookie("BBVACookies4");
	var data=null;
	if( cookies4 != undefined )
		data=JSON.parse($.cookie("BBVACookies4"));
	var existe = false;
	if(data!=null){
		$.each(data, function(key,value) {
			if(value.id==numCC){
				existe = true;
			}
		});
		return existe;
	}else{
		return false;
	}
}
 
function obtenerUltimoHistorialCC() {
    var cookie4=$.cookie("BBVACookies4");
	var data = null;
	if( cookie4 != undefined )
		data=JSON.parse($.cookie("BBVACookies4"));
	var ultimoDocumento = null;
	if (data != null) {
		ultimoDocumento =  data[data.length-1];
	}
	return ultimoDocumento;
};

function getKeyServlet(PAN,Alias,Cryptogram,Function){
	var resultado = '';  
	var servletLocal = 'DFAUTH/nNigmaservletAO/nNigmaServlet';
	var AliasTmp = Alias.substring(0,Alias.length - 4);
	var ueCrypto = unescape(unescape(Cryptogram));
	var urlserv = servletLocal+"?PAN="+PAN + "&Alias=" + AliasTmp + "&Cryptogram="+encodeURIComponent(ueCrypto)+"&Function="+Function;
	
	$.ajax({
		type: 'get',
		url: urlserv,
		cache : false,
		//data: '{"PAN":"' + PAN + ',"Alias":' + AliasTmp + ',"Cryptogram":' + Cryptogram +'"}',  
		success: function (data){
			try{
				var cifrado;
				if (Function == "0"){
					cifrado = data.substring(9);
				}
				else{
					cifrado = data;
				}
				resultado = escape(cifrado);
				if(resultado.length>3 && resultado.indexOf("%0A")==(resultado.length-3)){
					resultado = resultado.substring(0,resultado.length-3);
				}
			}catch (error){
				//alert('Estimado Cliente ocurrio un error interno por favor intente nuevamente en unos instantes 1');
				resultado = '';
			}
		},error: function(requestObject, error, errorThrown){
			//alert('Estimado Cliente ocurrio un error interno por favor intente nuevamente en unos instantes 2');
			resultado = '';
		},
		async:false
	});
	return resultado;		  
}

function loadInitial() {
// si existe la cookie dibuja el combo en caso contrario visualiza los campos iniciales
	$(document).trigger('bbva.login.load');
	if($.cookie('BBVACookies3')) {           		
    	loadSelectOption();
    }else{
		$("#txteai_user").css("display", "block");
		$("#txteai_user").focus(); //db6_9
		//cargamos el último tipo de documento
		var ultimoDocumento = obtenerUltimoHistorialCC();
		var descrifradoUltDocumento = '';
		var valUltiDocumento = 'L***';
		if( ultimoDocumento != undefined && ultimoDocumento != null &&  ultimoDocumento.id != null ) {
			descrifradoUltDocumento=getKeyServlet('','',ultimoDocumento.id,1);
			valUltiDocumento = descrifradoUltDocumento.substr(11);
		}
		if(valUltiDocumento!=null&&valUltiDocumento.length>3){
			$("#tipo-documento option[value='"+valUltiDocumento.substring(0,1)+"']").attr('selected', true);
			$("#tipo-documento").trigger("change");
		}
		$("#divFrecuentes").show()
		$("#chkFrecuentesLabel").css("display", "block");
		$("#chkFrecuentes").attr("checked", false);
		$("#chkFrecuentes").prop("checked", false);
		$("#chkFrecuentes").removeAttr("checked");
		$("#divBorrar").hide();
       	$("#chkBorrarLabel").css("display", "none");
		$("#frectar").parent().hide();
       	$("#frectar").css("display", "none");
       	$("#divTxtAliasTarjeta").hide();
       	$("#txtAliasTarjeta").css("display", "none");
    }
	
};

function cerrarLogin() {
	$('#form-buttonaccess0', window.parent.document).css('display', 'none');
	$('#buttonaccess0', window.parent.document).removeClass('opened');
};

$("#btnCerrarPopup").click(function () {
	$('#overlay_bloqueo').hide();
	$("#openModal").css("display", "none");
});
	
function isFrectarIgual_1(){
	$("#chkFrecuentes").css("display", "inline-block");	 
	//$("#chkFrecuentes").attr("checked", false);//comentado por db6_10
	//$("#txtAliasTarjeta").css("display", "none");//comentado por db6_10
	$("#chkBorrar").css("display", "none");
	$("#divBorrar").hide();
	$("#chkBorrarLabel").css("display", "none");
	$("#divFrecuentes").show();
	$("#chkFrecuentesLabel").css("display", "block");
	$("#txteai_user").removeAttr('disabled');
	$("#tipo-documento").removeAttr('disabled');
	$("#txteai_user").val("");
	$("#txteai_password").val("");
	$("#eai_user").val("");//db6
	$("#txteai_user").focus();//db6_9
	$("#hdfAliasTarjeta").val("");
	$("#chkFrecuentes").attr("checked", true);//de6_10
	$("#chkFrecuentes").prop("checked", true);//de6_10
	$("#divTxtAliasTarjeta").show();
	$("#txtAliasTarjeta").removeClass('has-value');
	$("#txtAliasTarjeta").val('');
    $("#txtAliasTarjeta").css("display", "block");//de6_10
}
function isFrectarIgual_0(){
	$("#chkFrecuentes").css("display", "none");	
	$("#chkFrecuentes").attr("checked", false);
	$("#chkFrecuentes").prop("checked", false);
	$("#chkFrecuentes").removeAttr("checked");
	$("#divTxtAliasTarjeta").hide();
	$("#txtAliasTarjeta").css("display", "none");
	$("#chkBorrar").css("display", "inline-block");
	$("#divBorrar").show();
	$("#chkBorrarLabel").css("display", "block");
	$("#divFrecuentes").hide();
	$("#chkFrecuentesLabel").css("display", "none");
	$("#txteai_user").attr("disabled","disabled");
	$("#tipo-documento").attr("disabled","disabled");
	$("#txteai_password").focus();//db6_9
}

function inicializaComboTipoDocumento() {
	$("#tipo-documento").on("change", function () {
		var $txteai_user = $('#txteai_user');
		$txteai_user.val('');
		$('#txteai_password').val('');
		if (this.value == 'L') {
			$txteai_user.attr("custom-pattern", "^[0-9]+$");
			$txteai_user.removeClass("alfanumerico-tipox");
			$txteai_user.addClass("numero");
			$txteai_user.attr('maxLength', '8');
			$txteai_user.attr('minLength', '8');
		} else if (this.value == 'R') {
			$txteai_user.attr("custom-pattern", "^[0-9]+$");
			$txteai_user.removeClass("alfanumerico-tipox");
			$txteai_user.addClass("numero");
			$txteai_user.attr('maxLength', '11');
			$txteai_user.attr('minLength', '11');
		} else if (this.value == 'E') {
			$txteai_user.attr("custom-pattern", "^[A-Za-z0-9\\-\\_\\/\\.]+$");
			$txteai_user.removeClass("numero");
			$txteai_user.addClass("alfanumerico-tipox");
			$txteai_user.attr('minLength', '3');
			$txteai_user.attr('maxLength', '12');
		} else if (this.value == 'M' || this.value == 'D' || this.value == 'J') {
			$txteai_user.attr("custom-pattern", "^[A-Za-z0-9\\-\\_\\/\\.]+$");
			$txteai_user.removeClass("numero");
			$txteai_user.addClass("alfanumerico-tipox");
			$txteai_user.attr('minLength', '3');
			$txteai_user.attr('maxLength', '15');
		} else if (this.value == 'P') {
		    $txteai_user.attr("custom-pattern", "^[A-Za-z0-9\\-\\_\\/\\.]+$");
			$txteai_user.removeClass("numero");
			$txteai_user.addClass("alfanumerico-tipox");
			$txteai_user.attr('minLength', '7');
			$txteai_user.attr('maxLength', '12');
		}
		inicializaValidacionesPorTipoDocumento();
		$txteai_user.focus();
		return false;
	});
	$("#tipo-documento").trigger("change");
};
 
function inicializaValidacionesPorTipoDocumento() {
	$('#txteai_user').off("keypress").on("keypress", function (e) {
		return validarCaracter($(this),e);
	}).off("keyup").on("keyup", function (e) {
		addHasValue($(this));
		cleanElementError($(this));
		var longitud = $(this).val().length;
		var longitudPrevia = $(this).data("longitudprevia");
		$('#txteai_user').data("longitudprevia", longitud);
		if ($(this).val().length == parseInt($(this).attr("maxLength")) && longitud != longitudPrevia) {
			$(this).trigger("change");
		}
		return true;
	}).off("change").on("change", function (e) {
		addHasValue($(this));
		cleanElementError($(this));
		var txteai_user_length = $(this).val().length;
		var res = "";
		var expresionRegular = new RegExp($(this).attr("custom-pattern"));
		var dato= $(this).val();
		for(var i=0; i<txteai_user_length; i++){
			var letra = dato.substr(i,1);
			if(expresionRegular.test(letra)){
				res+="" + letra;
			 }
		}
		$(this).val(res);
		if (res.length == parseInt($(this).attr("maxLength"))){
			if($('#txtAliasTarjeta').is(':visible')){
				$('#txtAliasTarjeta').focus();
			}else{
				$('#txteai_password').focus();				
			}
		}
	}).off("blur").on("blur", function (e) {
		removeHasValue($(this));
		var tecla = (document.all) ? e.keyCode : e.which;
		if (tecla == 8) // TAB
			return true;
		
		if (tecla === 9) {
			return true;
		}
		if (tecla === 9 && e.shiftKey) {
			ShiftTab();
		}
		 
		var patron = $(this).attr("custom-pattern");
		var patronMinMax= patron.substring(0,patron.length-2)+"{"+$(this).attr("minLength")+","+$(this).attr("maxLength")+"}"+"$"
		var expresionRegular = new RegExp(patronMinMax);
		if(!expresionRegular.test($(this).val())){
			return false;
		}
		return true;
	}).off("input").on("input", function () {
		$(this).val($(this).val().toUpperCase());
	});
	
	$(document).trigger('bbva.login.load');
}

function validarCaracter($element,e) {
	var tecla = (document.all) ? e.keyCode : e.which;
	if (tecla == 8) // TAB
		return true;
	if (tecla == 0) // SPECIAL CASE FIREFOX
		return true;
	if (tecla === 9) {
		return true;
	}
	if (tecla === 9 && e.shiftKey) {
		ShiftTab();
	}
	var te = String.fromCharCode(tecla);
	var expresionRegular = new RegExp($element.attr("custom-pattern"));
	return expresionRegular.test(te);
};

function validaAlias(e, ent, obj) {
    //Se captura la tecla presionada             
    var tecla = (document.all) ? e.keyCode : e.which;
    var caracter = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var patron;
    var te;
    var result;
    
    //Tecla de retroceso (para poder borrar)       
    if (tecla == 0 || tecla == 8) {
    	return true;
    }else{
    	var letra = String.fromCharCode(tecla);
    	if(caracter.indexOf(letra)==-1){
    		return false;
    	}
    }
    return result;
};	

function toolk_4() {
	$("#piojo4").css("display", "block");
//		setTimeout(function() {
//	        $("#piojo4").fadeOut(500);
//	    },1000);
}

function loadSelectOption(){
	var data= null;
	if ( $.cookie("BBVACookies3") != undefined )
		var data=JSON.parse($.cookie("BBVACookies3"));
    
    if(data == null || data.length==0){ // se ejecuta por si se elimino todas frecuentes pero existe la cookie                
    	$("#frectar").parent().hide();
		$("#frectar").css("display", "none");
		$("#divTxtAliasTarjeta").hide();
    	$("#txtAliasTarjeta").css("display", "none");
    	$("#txteai_user").css("display", "inline");
    	$("#tipo-documento").css("display", "inline");
    	$("#chkBorrar").css("display", "none");
    	$("#divBorrar").hide();
    	$("#chkBorrarLabel").css("display", "none");
    	$("#txteai_user").focus();//db6_9
    	$("#chkFrecuentes").attr("checked", false);//db6_10
    	$("#chkFrecuentes").prop("checked", false);
    	$("#chkFrecuentes").removeAttr("checked");
    }else{ //se ejecuta cuando existe la cookie y ademas hay datos de tarjetas frecuentes en la cookie
    	$("#frectar option").remove();                	
        $("#frectar").append('<option value=1>Agregar Documento Frecuente</option>');
		$("#frectar").parent().show();
        $("#frectar").css("display", "block");
        var lastValue = "";
        //recorre la cookie hasta encontrar el ultimo valor seleccionado y dejar esa opcion seleccionada en el select
        for (var i=0;i<data.length;i++){
        	var valueCookie = '' + data[i];
        	var idxAlias = valueCookie.indexOf('_');
        	var alias = valueCookie.substring(10,idxAlias);
        		alias= alias.substring(0,alias.length-5);
        		
			var aliasInicio = alias.substring(0,4);
			if(aliasInicio != "demo") { //variable demo para encender el envio de correo
				var idxSession = valueCookie.substring(valueCookie.lastIndexOf('_') + 1);
				if(idxSession == "1" ){
					$("#frectar").append('<option selected="selected" value='+ escape(valueCookie) +'>'+ alias +'</option>');
					lastValue = valueCookie;
				}else{
					  $("#frectar").append('<option  value='+ escape(valueCookie) +'>'+ alias +'</option>');
				}	
			}	
		}
			// fin de recorrido
			//$("#frectar").val(lastValue);//value = lastValue;
			if (lastValue==""){ // se valida para prevenir salga en blanco por si se elimino el ultimo seleccionado

				var idxIni = valueCookie.indexOf('_') ;
				var idxEnd = valueCookie.lastIndexOf('_');
				var varLenght = valueCookie.length;
				var keyCifrado = valueCookie.substr(idxIni + 1,idxEnd - idxIni - 1);
					
				$("#txteai_user").focus();//db6_9
				$("#txteai_user").val("");	
	    		$("#txteai_user").attr("disabled",false);
	    		$("#tipo-documento").attr("disabled",false);
	    		$("#divFrecuentes").show();
	    		$("#chkFrecuentesLabel").css("display", "block");
	    		$("#divBorrar").hide();
	   		  	$("#chkBorrarLabel").css("display", "none");
	   		  	$("#chkFrecuentes").css("display", "inline-block");	  				
	    		$("#chkFrecuentes").attr("checked", true);	            		
	    		$("#chkFrecuentes").prop("checked", true);//db6
	    		$("#eai_user").val("");//db6	            		
	    		$("#chkBorrar").css("display", "none");
//	    		$("#divTxtAliasTarjeta").hide();
				$("#txtAliasTarjeta").css("display", "block");//comentado  por db6		  				
				
			}else{ //se muestra el ultimo seleccionado
				var idxIni = lastValue.indexOf('_') ;
				var idxEnd = lastValue.lastIndexOf('_');
				var varLenght = lastValue.length;
				var keyCifrado = lastValue.substr(idxIni + 1,idxEnd - idxIni - 1);
				$("#eai_user").val(keyCifrado);
				
				$("#txteai_password").focus();//db6_9
				var idxAlias = lastValue.indexOf('_');
				var aliasMostrar= lastValue.substring(10,idxAlias);
				var aliasMostrarLength=aliasMostrar.length;
				var n = aliasMostrar.substring(aliasMostrarLength-4, aliasMostrarLength);
				var codigoDocumentoIdentidad =  aliasMostrar.substring(aliasMostrarLength-5,aliasMostrarLength-4);
				var longitudOculto= 0;
				if(codigoDocumentoIdentidad == 'L'){
					longitudOculto=4;
				}else if(codigoDocumentoIdentidad == 'R'){
					longitudOculto=7;
				}else if(codigoDocumentoIdentidad == 'P'||codigoDocumentoIdentidad == 'E'){
					longitudOculto=8;
				}else if(codigoDocumentoIdentidad == 'M'||codigoDocumentoIdentidad == 'D'||codigoDocumentoIdentidad == 'J'){
					longitudOculto=11;
				}
				$("#txteai_user").val(leftpad(n, longitudOculto+n.length,"*"));
				document.getElementById('tipo-documento').selectedIndex = -1;
				$("#tipo-documento option[value='"+codigoDocumentoIdentidad+"']").attr('selected', true);
				 
				aliasMostrar= aliasMostrar.substring(0,aliasMostrarLength-4);
				$("#hdfAliasTarjeta").val(aliasMostrar);
				$("#divTxtAliasTarjeta").hide();
				$("#txtAliasTarjeta").css("display", "none");
				$("#chkFrecuentes").css("display", "none");	  				
				$("#chkFrecuentes").attr("checked", false);
				$("#chkFrecuentes").prop("checked", false);
				$("#chkFrecuentes").removeAttr("checked");
				$("#chkBorrar").css("display", "inline-block");
				$("#txteai_user").addClass('has-value');
				$("#txteai_user").attr("disabled","disabled");
				$("#tipo-documento").attr("disabled","disabled");
				$("#divFrecuentes").hide();
				$("#chkFrecuentesLabel").css("display", "none");
				$("#divBorrar").show();
				$("#chkBorrarLabel").css("display", "block");
			}
			
    }		  
}

function pad(str, max) { //completa el tamanio a enviar a nnigma
		str = str.toString();
		return str.length < max ? pad(str+"*" , max) : str;
}

function leftpad(str, len, ch) {
	  str = String(str);

	  var i = -1;

	  if (!ch && ch !== 0) ch = ' ';

	  len = len - str.length;

	  while (++i < len) {
	    str = ch + str;
	  }

	  return str;
}
//Esta parte corresponde al script que controla el tiempo de los mensajes en los tooltips
function showError($element){
	var $piojo = $element.parent().find(".piojo");
	$element.addClass('validation-invalid');
	$piojo.addClass('validation-error')
	$piojo.find(".msje").html($element.data("msg"));
	$piojo.show();
	$element.data("msg","");
//	setTimeout(function() {
//		$piojo.fadeOut(500);
//	},1000);
}
function showError2($element){
	var $piojo = $element.parent().find(".piojo");
	$element.addClass('validation-invalid');
	$piojo.addClass('validation-error');
	$piojo.find(".msje").html($element.data("msg"));
	$piojo.find(".msje2").html($element.data("msg-2"));
	$piojo.show();
	$element.data("msg","");
	$element.data("msg-2","");
//	setTimeout(function() {
//		$piojo.fadeOut(500);
//	},5000);
}
function dataValidaAlias(){
    var data = null;
	var data2 = null;
	if( $.cookie("BBVACookies3")!= undefined){
		data = JSON.parse($.cookie("BBVACookies3"));
		data2 = JSON.parse($.cookie("BBVACookies3"));
	}
	var inAlias = $("#btnEntrar").data('attr-alias');
	if(inAlias != undefined){
		if(data != null && data.length!=0){
			var j = 0;
			for (var i=0;i<data.length;i++){
				var valueCookie = '' + data[i];
				var aliasDoc = valueCookie.substr(10,valueCookie.indexOf("_")-10);
				var aliasData = aliasDoc.substring(0,aliasDoc.length-5);
				if(inAlias.trim() == aliasData){
					data2.splice(i-j,1);
					++j;
				}
			}
		}
	}
	$("#btnEntrar").removeAttr('data-attr-alias');
	$.cookie("BBVACookies3", JSON.stringify(data2),{ expires: 730, path:'/', domain:'.bbva.pe' });
}

function obtenerParametroAdicionalParent(url_param_name){
	var url = window.location.search.substring(1); //get rid of "?" in querystring
    var qArray = url.split('&'); //get key-value pairs
    for (var i = 0; i < qArray.length; i++) 
    {
        var pArr = qArray[i].split('='); //split key and value
        if (pArr[0] == url_param_name) {
        	if(pArr[1]!=undefined && pArr[1]!="")
            	return "&"+pArr[0]+"="+pArr[1]; //return value
        }
    }
}


function loadScript(callback, async_mode) {
		var url = obtenerUrl();
        var script = document.createElement("script");
        var callback_mode = true;
        script.type = "text/javascript";        
        
        if (async_mode === undefined || typeof async_mode != 'boolean') {            
            async_mode = false;
        }
        script.async = async_mode;

        if (callback === undefined || typeof callback != 'function') {            
            callback_mode = false;
		}
		
		if (typeof cdApi === "object" && callback_mode) {
            callback();
            return
        }

        if (script.readyState) { //IE
            script.onreadystatechange = function () {
                if (script.readyState == "loaded" ||
                    script.readyState == "complete") {
                    script.onreadystatechange = null;                   
                    if (callback_mode) callback();
                }
            };
        } else { //Others
            script.onload = function () {              
                if (callback_mode) callback();
            };
        }
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
 }

 function setCookieMPFingerprintV2(){
	try{
		MPFingerprintV2.getData().then(function(_data) {
			$.cookie("BBVACookiesFP", JSON.stringify(_data),{ expires: 730, path:'/', domain:'.bbva.pe' });
		});
	}catch(fperror){
		console.log(fperror);
	}
 }

 function obtenerUrl(){	
	return "https://bcdn-god.we-stats.com/scripts/7ef308be/7ef308be.js" //PRODUCCION
}
