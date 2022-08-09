processForm = (form) => {
    const pacer = document.getElementById("pacer");
    const main = document.getElementById("main");

    new Promise((resolve, reject) => {
      console.log("step 1 - acquire one-time authentication token...");

      main.style.display = "none";
      pacer.children[0].textContent = "Processing....";
      pacer.style.display = "";
      pacer.children[0].textContent = " ";

      const request = new XMLHttpRequest();
      request.open("GET", "/auth-token.json", true);
      request.onload = () => {
        console.log(request.status);
        if (request.status === 200) {
          const token = JSON.parse(request.responseText);
          resolve(token);
        } else {
          reject(request.responseText);
        }
      };

      request.onerror = () => {
        reject(request.responseText);
      };
      request.send();
    }).then((token) => {
      return new Promise((resolve, reject) => {
        console.log(
          "step 2 - use token to submit content for processing..."
        );
        console.log("using token:", token.id);
        pacer.children[0].textContent = " ";

        //scanning button..
        let btn = document.createElement("button");
        btn.innerHTML = "Scanning  ";
        btn.className = "btnClass";
        pacer.children[0].appendChild(btn);

        //scanning icon..
        let icon = document.createElement("span");
        icon.className = "fa fa-refresh fa-spin";
        btn.appendChild(icon);
       
        // status bar..
        function progress(){
          var percent = document.querySelector('.percent');
          var progress = document.querySelector('.progress');
          var text = document.querySelector('.text');
          var count = 4;
          var per = 16;
          var loading = setInterval(animate, 50);
          function animate(){
            if(count == 100 && per == 400){
              percent.classList.add("text-blink");
              text.style.display = "block";
              clearInterval(loading);
            }else{
              per = per + 4;
              count = count + 1;
              progress.style.width = per + 'px';
              percent.textContent = count + '%';
            }
          }
        }
        progress();


        const credentials = btoa(token.id + ":");
        const formData = new FormData();
        formData.append("file", document.getElementById("file").files[0]);

        const request = new XMLHttpRequest();
        request.open("POST", "https://api.scanii.com/v2.1/files", true);

        request.setRequestHeader("Authorization", "Basic " + credentials);

        request.onload = () => {
          console.log(request.status);
          if (request.status === 201) {
            console.log(request.responseText);
            resolve(JSON.parse(request.responseText));
          } else {
            reject(request.responseText);
          }
        };

        request.onerror = () => {
          reject(request.responseText);
        };

        request.send(formData);
      }).then((result) => {
        console.log("step 3 - process content analysis result...");
        console.log("using result:", result.findings);

    

        if (result.findings.length > 0) {
          pacer.children[0].textContent = `Content denied, reason:`;
          const findingsElement = document.createElement("pre");
          findingsElement.textContent = result.findings;
          pacer.appendChild(findingsElement);
        } else {
          pacer.children[0].textContent =
            "Content clean, uploading to server...";

          // before submitting we append the file id to the form for server-side validation:
          document
            .getElementById("fileId")
            .setAttribute("value", result.id);
          form.submit();
        }
      });
    });

    return false;
  };
