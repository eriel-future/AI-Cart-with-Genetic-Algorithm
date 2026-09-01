# Carrinho IA com Algoritmo Genético

Projeto acadêmico em HTML, CSS e JavaScript no qual carrinhos aprendem a dirigir usando conceitos de Algoritmos Genéticos.

## Funcionalidades

- Carrinhos com 5 sensores de distância.
- Cada carrinho é um indivíduo da população.
- Rede neural simples como cérebro do carrinho.
- Sistema de fitness baseado em checkpoints, aproximação do próximo checkpoint e punições.
- Punição para indivíduos que batem ou ficam muito tempo sem progresso.
- Seleção dos melhores indivíduos.
- Cruzamento entre os melhores cérebros.
- Baixa taxa de mutação.
- Treinamento individual por pista.
- Botão **Treinar todas** para treinar e salvar uma IA para cada uma das 3 pistas.
- Salvamento dos melhores indivíduos por pista no navegador.
- Botão **Testar 3 pistas** para comprovar o desempenho dos indivíduos salvos.
- Download dos melhores indivíduos em JSON.

## Como rodar

Abra o arquivo `index.html` no navegador.

Também é possível usar a extensão Live Server no VS Code:

1. Abra a pasta do projeto no VS Code.
2. Clique com o botão direito no `index.html`.
3. Escolha `Open with Live Server`.

## Como usar

### Opção recomendada para entregar

1. Clique em **Treinar todas**.
2. Espere o sistema treinar as 3 pistas.
3. Veja o campo **IAs salvas** mostrando P1, P2 e P3.
4. Clique em **Testar 3 pistas**.
5. Grave o vídeo mostrando o resultado.

### Treinar apenas uma pista

1. Escolha uma pista.
2. Clique em **Treinar pista atual**.
3. Quando o carrinho completar a pista ou atingir bom fitness, clique em **Salvar melhor da pista**.
4. Clique em **Testar melhor da pista**.

## Conceitos usados

### Indivíduos

Cada carrinho representa um indivíduo da população.

### Sensores

Os sensores medem a distância até as paredes da pista. Essas distâncias são usadas como entrada para a rede neural.

### Fitness

O fitness recompensa carrinhos que passam por checkpoints e que se aproximam do próximo checkpoint. Carrinhos que batem ou ficam muito tempo sem progresso são punidos.

### Seleção

Os melhores indivíduos da geração são selecionados para gerar novos indivíduos.

### Cruzamento

Os pesos da rede neural de dois pais são misturados para formar o cérebro dos filhos.

### Mutação

Uma pequena taxa de mutação altera alguns pesos aleatoriamente para permitir novas soluções.

## Observação importante

É normal uma pista demorar mais para ser aprendida. Algoritmos genéticos dependem de tentativa, erro e aleatoriedade. Algumas gerações podem não ter nenhum carrinho completando a pista, principalmente em pistas estreitas ou com muitas curvas.

## Sugestão para o vídeo

No vídeo, mostre:

1. O projeto aberto no navegador.
2. O botão **Treinar todas** sendo usado.
3. Os carrinhos evoluindo por gerações.
4. As IAs salvas para P1, P2 e P3.
5. O botão **Testar 3 pistas**.
6. As dificuldades encontradas, como ajustar sensores, fitness, colisão, mutação e tempo de treinamento.
7. O link do repositório no GitHub.

## Dificuldades encontradas

- Ajustar os sensores para detectar corretamente as paredes.
- Criar uma função de fitness justa.
- Evitar que carrinhos fiquem andando em círculos.
- Balancear a taxa de mutação.
- Fazer cada pista ter um indivíduo treinado salvo.
- Lidar com pistas mais difíceis, que podem levar mais gerações para serem concluídas.
