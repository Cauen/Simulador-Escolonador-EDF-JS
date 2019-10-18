$(document).ready(function() {
    if (localStorage.processos)
        var processos = JSON.parse(localStorage.processos);
    else var processos = [];
    var escalonadoAinda = false;

    var adicionarProcesso = function(name, exectime, deadline, period, save, id, color) {
        if (!id)
            var id = ID();
        if (!color)
            var color = getRandomColor();

        $('#processos tbody').after(`
      <tr procid="` + id + `">
        <td><input style="color: ` + color + `"class="name" value="` + name + `"></td>
        <td><input class="temp" type="number" value="` + exectime + `"></td>
        <td><input class="dead" type="number" value="` + deadline + `"></td>
        <td><input class="peri" type="number" value="` + period + `"></td>
        <td>
            <i style="background: #F44336;" class="btn waves-effect waves-light waves-input-wrapper deletar">x</i>
            <i style="background: #2196F3;" class="btn waves-effect waves-light waves-input-wrapper duplicar">=</i>
        </td>
      </tr>`);

        if (save) {
            processos.push({
                id: id,
                processo: name,
                tempoExecucao: exectime,
                deadline: deadline,
                periodo: period,
                runCount: 0,
                cor: color
            });
            localStorage.processos = JSON.stringify(processos);
        }
    }

    //Gerar id aleatório para o processo
    var ID = function() {
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    //Quando carregar página, adicionar processos do localstorage
    Object.keys(processos).forEach(function(key) {
        adicionarProcesso(processos[key].processo, processos[key].tempoExecucao, processos[key].deadline, processos[key].periodo, false, processos[key].id, processos[key].cor);

    });
    log(processos);



    $('#addProcesso').on('submit', function(e) {
        e.preventDefault();
        var proc = $('#processo').val();
        var temp = $('#tempoExecucao').val();
        var dead = $('#deadline').val();
        var peri = $('#periodo').val();

        if (!proc)
            proc = "Processo " + eval(processos.length + 1);
        if (!temp || !dead || !peri) {
            toastr.error('Insira os dados antes');
            return false;
        }


        adicionarProcesso(proc, temp, dead, peri, true);

    });
    
    var _schedulerIteration = 0;
    var _runTime = 0;

    var pRuntime = 0;
    var pPeriod = 0;
    var totalResult = 0;

    function iniciarEscalonamento() {
        
        var paraEscrever = proximos;
        var tempo = options.segundos;
        tempo = parseInt(tempo)  
        
        execucaoPassoAPasso=setInterval(function() {  
        
            passoManual();


        },tempo);
        
    }

    $('body').on('click', '#passo', function() {
        passoManual();
    });

    $('body').on('click', '#pausar', function() {
        clearInterval(execucaoPassoAPasso);
        $("#pausar").addClass( "disabled" );
        $("#iniciar").removeClass( "disabled" );
    });

    function passoManual() {
        if (proximos.length < 1)
            escalonar();
        passoAPasso();
    }

    var vazio = 0;
    var executou = 0;

    function escalonar() {
            if(!escalonadoAinda) {
                processos.map(function(proc) {
                    //Zerar os runCount
                    proc.runCount = 0;

                    pRuntime = proc.tempoExecucao;
                    pPeriod = proc.periodo;

                    totalResult += eval(pRuntime) / eval(pPeriod);
                });

                if (totalResult > 1) {
                    log("O escalonador pode não ser capaz de atender a todos os deadlines");
                    log("<br>");
                }

                escalonadoAinda = true;
            }

            

            var lowestDeadline = Number.MAX_SAFE_INTEGER;
            var selectedProcess = 0;

            var scheduledTask = false;
            var lostDeadline = false;

            // Verifica processos inativos
            processos.map(function(proc) {
                var procDeadline = proc.deadline;
                var procPeriod = proc.periodo;

                // Quantidade de vezes que foi escalonado
                var procCount = proc.runCount || 0;
                var currentPeriod = procCount * procPeriod;

                if (currentPeriod <= _runTime // Periodo de ativação do processo
                    &&
                    eval(currentPeriod) + eval(procDeadline) - _runTime < lowestDeadline) // Tempo de deadline
                {
                    scheduledTask = true;
                    lowestDeadline = eval(currentPeriod) + eval(procDeadline) - _runTime;
                    selectedProcess = proc;

                    if ((eval(_runTime) + eval(proc.tempoExecucao)) > (eval(currentPeriod) + eval(procDeadline))) {
                        lostDeadline = true;
                        proc.perdeuDeadline = true;
                    } else {
                        lostDeadline = false;
                        proc.perdeuDeadline = false;
                    }
                }
            })

            if (scheduledTask) {
                _procActive = selectedProcess;
                if (_procActive.runCount)
                    ++_procActive.runCount;
                else
                    _procActive.runCount = 1;

                log("<br>");
                // Tarefera está rodando
                log("Iteração " + ++_schedulerIteration + ", processo: " + _procActive.processo, _procActive);
                log("Tempo de execução: " + _runTime, _procActive);

                if (lostDeadline) {
                    log("Deadline perdido", _procActive);
                    _procActive.perdeuDeadline = true;
                }

                log("Task: " + _procActive.processo + ": Running", _procActive);
                log("Task: " + _procActive.processo + ": Ready", _procActive);

                //
                adicionarProgresso(_procActive);

                // Adiciona tempo no contador do escalonador
                _runTime += eval(_procActive.tempoExecucao);
            } else {
                log("<br>");
                log("Iteração: " + ++_schedulerIteration);
                log("Tempo de execucao: " + _runTime);
                log("Nenhum processo apto para rodar");
                adicionarProgresso();
                ++_runTime;
            }
    }

    var proximos = [];
    function adicionarProgresso(processo) {
        if (!processo) {
            var div = '<div class="tooltipped" data-tooltip="CPU vazia" style="background-color: #fafafa00"></div>';
            ++vazio;
            proximos.push(div);
            return;
        }
        for (var i = 0; i < processo.tempoExecucao; i++) {
            ++executou;
            if (processo.perdeuDeadline) 
                
                var div = '<div class="tooltipped" data-tooltip="(Deadline perdido) ' + processo.processo + '" style="background-image: linear-gradient('+processo.cor+' 80%, black 20%)" procid="' + processo.id + '"></div>';
             else
            var div = '<div class="tooltipped" data-tooltip="' + processo.processo + '" style="background-color: ' + processo.cor + '" procid="' + processo.id + '"></div>';
            
            proximos.push(div);
        }
        
        $('#aproveitamento').text((executou*100/(executou+vazio)).toFixed(2) + "%");
        
    }
    
    var execucaoPassoAPasso;
    function passoAPasso() {;
        
        var tempo = options.segundos;
        tempo = parseInt(tempo)
        var paraEscrever = proximos;
        //Apenas uma vez
        var first = paraEscrever.shift();
        $(first).css('width', '0');
        if (!first) clearInterval(execucaoPassoAPasso);

        //jQuery('#partes').append(first).slideDown('fast');
        var reduzir = options.margem == 'on' ? 2 : 0;
        var newHeight = $('#partes').width()/options.quantidade - reduzir;
        jQuery(first).appendTo($('#partes')).animate({width: newHeight}, tempo, 'linear').tooltip({
            inDuration: 0,
            outDuration: 0,
            position: 'top',
            exitDelay: 0,
            enterDelay: 0
        });
        
    }

    $('tr').on('input', 'input', function() {

        var $row = $(this).closest('tr');

        var name = $row.find('.name').val();
        var temp = $row.find('.temp').val();
        var dead = $row.find('.dead').val();
        var peri = $row.find('.peri').val();

        var id = $row.attr('procid');
        processos.map(function(proc) {
            if (proc.id == id) {
                proc.processo = name;
                proc.tempoExecucao = temp;
                proc.deadline = dead;
                proc.periodo = peri;
            }
        });
        log(processos);

        localStorage.processos = JSON.stringify(processos);
    });

    function deletarProcesso(id) {
        log(id);

        processos = processos.filter(function(item) {
            return item.id != id;
        });
        localStorage.processos = JSON.stringify(processos);
        log(processos);
    }

    $('body').on('click', '#iniciar', function() {
        log('Iniciando');
        $("#pausar").removeClass( "disabled" );
        $("#iniciar").addClass( "disabled" );
        iniciarEscalonamento();
    });

    $('#processos').on('click', '.deletar', function(e) {
        e.preventDefault();
        var $row = $(this).closest('tr');

        $row.remove();

        var id = $row.attr('procid');
        deletarProcesso(id);

    });

    $('#processos').on('click', '.duplicar', function(e) {
        e.preventDefault();

        var $row = $(this).closest('tr');
        $row.clone();

        var id = $row.attr('procid');
        var name = $row.find('.name').val() + ' (2)';
        var temp = $row.find('.temp').val();
        var dead = $row.find('.dead').val();
        var peri = $row.find('.peri').val();
        adicionarProcesso(name, temp, dead, peri, true);

    });

    function log(x, proc) {
        if (!proc)
            proc = {
                id: 'none',
                cor: 'black'
            };
        if (typeof x == 'string') {
            ;//console.log(x);
            if (options.logs)
            jQuery("#logs").append('<div procid="' + proc.id + '" style="color: ' + proc.cor + ';">' + x + '</div>');
            $("#logs").animate({
              scrollTop: $('#logs')[0].scrollHeight - $('#logs')[0].clientHeight
            }, 100);
        } else
            ;//console.log(x);
    }

    $('#processos').on('dblclick', 'tr', function(e) {
        e.preventDefault();
        return;
        $(this).remove();

        var id = $(this).attr('procid');
        deletarProcesso(id);

    });

    $('body').on('click', '#limpar', function(e) {
        e.preventDefault();
        $('#pausar').trigger('click');

        log('Limpando');
        
        //Recomeçar do zero

        vazio = 0;
        executou = 0;

        escalonadoAinda = false;

        _schedulerIteration = 0;
        _runTime = 0;

        pRuntime = 0;
        pPeriod = 0;
        totalResult = 0;
        
        //Apagar rastros do passado
        proximos = [];
        
        clearInterval(execucaoPassoAPasso);
        $('#logs > div').remove();
        $('#partes > div').remove();
    });

    $('body').on('click', '#cores', function(e) {
        e.preventDefault();
        log('Mudando cores');
        resetarCores();
    });

    function resetarCores() {
        processos.map(function(processo) {
            processo.cor = getRandomColor();
            $("table tr[procid='" + processo.id + "'] input.name").css('color', processo.cor);
            if(processo.perdeuDeadline)
            $("#partes div[procid='" + processo.id + "']").css('background-image', 'linear-gradient('+processo.cor+' 80%, black 20%)');
            else
            $("#partes div[procid='" + processo.id + "']").css('background-color', processo.cor);
            $("#logs div[procid='" + processo.id + "']").css('color', processo.cor);
        });



        localStorage.processos = JSON.stringify(processos);
    }

    function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});