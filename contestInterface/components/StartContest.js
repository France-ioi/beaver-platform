export default {
	init () {
		window.cancelStartContest = this.cancelStartContest.bind(this);
		window.reallyStartContest = this.reallyStartContest.bind(this);

	},
	load (data, eventListeners) {
		$("#divStartContest").show();
	},
	unload () {
		$("#divStartContest").hide();
	},
	cancelStartContest () {
		UI.AllContestsDone.unload();
		this.unload();
		UI.PersonalData.load();
	},
	reallyStartContest () {
		this.unload();
		window.checkGroupFromCode("CheckGroup", personalPageData.registrationData.code, false, false, null, true);
	}

}