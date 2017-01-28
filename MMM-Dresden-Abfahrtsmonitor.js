/* Magic Mirror
 * Module: MMM-Dresden-Abfahrtsmonitor
 *
 * By fewieden https://github.com/fewieden/MMM-Dresden-Abfahrtsmonitor
 * MIT Licensed.
 */

Module.register("MMM-Dresden-Abfahrtsmonitor", {

    index: 0,

    types: {
        "ptBusCity": "fa-bus",
        "ptTram": "fa-train",
        "ptTramWLB": "fa-train",
        "ptMetro": "fa-subway"
    },

    defaults: {
        max: 6,
        colored: false,
        //shortenStation: false,
        //shortenDestination: false,
        //rotateInterval: 20 * 1000,
        //updateInterval: 5 * 60 * 1000
    },

    getTranslations: function () {
        return {
            en: "translations/en.json",
            de: "translations/de.json"
        };
    },

    getScripts: function() {
        return ["moment.js"];
    },

    getStyles: function () {
        return ["font-awesome.css", "MMM-Dresden-Abfahrtsmonitor.css"];
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        moment.locale(config.language);

        this.stationReplaced = this.config.station;

        this.baseUrl = "http://widgets.vvo-online.de/abfahrtsmonitor/Abfahrten.do?";


        this.options =
            this.baseUrl +
            "hst=" + this.deUmlaut(this.stationReplaced) +
            "&vz=" + this.config.vz +
            "&lim=" + this.config.limit + '';

        setInterval(() => {
            this.intervalRun = true;
            this.updateDom();
        }, 300);
        this.sendSocketNotification("CONFIG", this.config);
    },

    deUmlaut: function(value) {
        value = value.toString();
        value = value.toLowerCase();
        value = value.replace(/ä/g, 'ae');
        value = value.replace(/ö/g, 'oe');
        value = value.replace(/ü/g, 'ue');
        value = value.replace(/ß/g, 'ss');
        value = value.replace(/ /g, '-');
        value = value.replace(/\./g, '');
        value = value.replace(/,/g, '');
        value = value.replace(/\(/g, '');
        value = value.replace(/\)/g, '');
        value = value.replace(/ /g, '');
        return value;
    },


    getStationInfo: function(url) {
        var self = this;
        var stationRequest = new XMLHttpRequest();
		stationRequest.open("GET", url, true);
		stationRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processStationInfo(JSON.parse(this.response));
				}  else {
					Log.error(self.name + ": Could not load Stationinfo.");
				}
			}
		};
		stationRequest.send();


    },

    processStationInfo: function(data) {
        this.station = data;

        if (!this.intervalRun) {
            this.updateDom();
        }
    },


    getDom: function () {
        this.getStationInfo(this.options);

        var wrapper = document.createElement("div");
        var header = document.createElement("header");
        header.classList.add("align-left");
        var logo = document.createElement("i");
        logo.classList.add("fa", "logo");
        header.appendChild(logo);
        var name = document.createElement("span");
        name.innerHTML = this.config.station;
        header.appendChild(name);
        wrapper.appendChild(header);

        if (!this.station) {
            var text = document.createElement("div");
            text.innerHTML = this.translate("LOADING");
            text.classList.add("dimmed", "light");
            wrapper.appendChild(text);
        } else {
            var table = document.createElement("table");
            table.classList.add("small", "table", "align-left");

            table.appendChild(this.createLabelRow());

            for (var i = 0; i < this.config.max; i++) {
                this.appendDataRow(this.station[i], table);
            }

            wrapper.appendChild(table);
        }

        return wrapper;
    },

    createLabelRow: function () {
        var labelRow = document.createElement("tr");

        var typeIconLabel = document.createElement("th");
        typeIconLabel.classList.add("centered");
        labelRow.appendChild(typeIconLabel);

        var lineIconLabel = document.createElement("th");
        lineIconLabel.classList.add("centered");
        //var lineIcon = document.createElement("i");
        //lineIcon.classList.add("fa", "fa-long-arrow-right");
        //lineIconLabel.appendChild(lineIcon);
        labelRow.appendChild(lineIconLabel);

        var directionIconLabel = document.createElement("th");
        directionIconLabel.classList.add("centered");
        //var directionIcon = document.createElement("i");
        //directionIcon.classList.add("fa", "fa-compass");
        //directionIconLabel.appendChild(directionIcon);
        labelRow.appendChild(directionIconLabel);

        var timeIconLabel = document.createElement("th");
        timeIconLabel.classList.add("centered");
        //var timeIcon = document.createElement("i");
        //timeIcon.classList.add("fa", "fa-clock-o");
        //timeIconLabel.appendChild(timeIcon);
        labelRow.appendChild(timeIconLabel);

        return labelRow;
    },

    appendDataRow: function (data, appendTo) {
        var row = document.createElement("tr");

        var type = document.createElement("td");
        type.classList.add("centered");
        if (this.config.colored) {
            if (data[2] <= this.config.minutesNotAchievable ) {
                row.classList.add("red");
            } else if (data[2] <= this.config.minutesHurryUp) {
                row.classList.add("orange");
            } else {
                row.classList.add("green");
            }
        }
        var typeIcon = document.createElement("i");
        typeIcon.classList.add("fa","fa-train");
        type.appendChild(typeIcon);
        row.appendChild(type);

        var line = document.createElement("td");
        line.classList.add("centered");
        line.innerHTML = data[0];
        row.appendChild(line);

        var destination_name = data[1];
        if(this.config.shortenDestination && destination_name.length > this.config.shortenDestination){
            destination_name = destination_name.slice(0, this.config.shortenDestination) + "&#8230;";
        }
        var towards = document.createElement("td");
        towards.innerHTML = destination_name;
        row.appendChild(towards);

        var time = document.createElement("td");
        time.classList.add("centered");
        var timeValue = data[2];
        if (timeValue === "") {
            timeValue = 0;
        }
        time.innerHTML = timeValue + " Min.";
        row.appendChild(time);
        appendTo.appendChild(row);
    }
});
