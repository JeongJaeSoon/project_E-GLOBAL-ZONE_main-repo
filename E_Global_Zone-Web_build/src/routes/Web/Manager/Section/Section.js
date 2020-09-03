import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
// import {
// 	getAdminForeignerWork,
// 	getAdminSection,
// 	postAdminSchedule,
// 	deleteAdminSchedule,
// 	getAdminForeigner,
// } from "../../../../modules/hooks/useAxios";

import { getAdminForeigner, getAdminForeignerWork } from "../../../../api/admin/foreigner";
import { postAdminSchedule, deleteAdminSchedule } from "../../../../api/admin/schedule";
import { getAdminSection } from "../../../../api/admin/section";

import deepmerge from "deepmerge";
import useModal from "../../../../modules/hooks/useModal";
import Modal from "../../../../components/common/modal/Modal";
import Loader from "../../../../components/common/Loader";

export default function Section(props) {
	const params = useParams();
	const history = useHistory();
	const [keysOfParams, setKeysOfParams] = useState(Object.keys(params));
	const [valuesOfParams, setValuesOfParams] = useState(Object.values(params));
	const [forList, setForList] = useState();
	const [sectName, setSectName] = useState();
	const [isDone, setIsDone] = useState(false);
	const [forName, setForName] = useState();
	const [scheduleList, setScheduleList] = useState({ 월: [], 화: [], 수: [], 목: [], 금: [] });
	const { isOpen, handleOpen, handleClose } = useModal();
	const {
		isOpen: isOpenForLoader,
		handleOpen: handleOpenForLoader,
		handleClose: handleCloseForLoader,
	} = useModal();

	const timeArray = [9, 10, 11, 12, 13, 14, 15, 16, 17];
	const dayArray = ["월", "화", "수", "목", "금"];

	const closure = (function () {
		let obj = { 월: [], 화: [], 수: [], 목: [], 금: [] };
		let toggle = false;
		let startDay = 0;
		let endDay = 0;
		let startTime = 0;
		let endTime = 0;
		return new (function () {
			this.toggle = function () {
				toggle = !toggle;
				return toggle;
			};

			this.dragStart = function (e) {
				startDay = parseInt(e.target.id.split("-")[0]);
				startTime = parseInt(e.target.id.split("-")[1]);
				// alert(e.target.id.split("-")[0] + `-` + e.target.id.split("-")[1]);
				// alert();
			};
			this.dragEnd = function (e) {
				endDay = parseInt(e.target.id.split("-")[0]);
				endTime = parseInt(e.target.id.split("-")[1]);
				// alert(`${startDay}-${startTime}~${endDay}-${endTime}`);
				// alert();
				for (let i = startDay; i <= endDay; i++) {
					let lastTime = i === endDay ? endTime : 17;
					for (let j = i === startDay ? startTime : 9; j <= lastTime; j++) {
						let dayOfSch = "";
						switch (i) {
							case 0:
								dayOfSch = "월";
								break;
							case 1:
								dayOfSch = "화";
								break;
							case 2:
								dayOfSch = "수";
								break;
							case 3:
								dayOfSch = "목";
								break;
							case 4:
								dayOfSch = "금";
								break;
						}
						let schedule = document.createElement("div");
						schedule.className = "time_area";
						schedule.style.zIndex = -9999;
						let day = new Object();
						Object.defineProperty(day, `${dayOfSch}`, {
							value: [j],
							enumerable: true,
						});
						obj = deepmerge(obj, day);
						//<div className="time_area">
						document.getElementById(`${i}-${j}`).appendChild(schedule);
					}
					setScheduleList(obj);
				}
			};
			this.handleCreate = function (e) {
				let schedule = document.createElement("div");
				schedule.className = "time_area";
				schedule.style.zIndex = -9999;

				let day = new Object();
				Object.defineProperty(day, e.target.id.slice(0, 1), {
					value: [parseInt(e.target.id.slice(2, 5))],
					enumerable: true,
				});

				console.log(day);
				// scheduleObject = deepmerge(scheduleObject, day);
				// setSchedule(scheduleObject);
				//<div className="time_area">
				e.target.appendChild(schedule);
				console.log(e.target);
				e.target.removeEventListener("click", closure.handleCreate);
				e.target.addEventListener("click", closure.handleRemove);
			};
			// this.handleRemove = function (e) {
			// 	console.log(e.target.id);
			// 	let findTarget = parseInt(e.target.id.slice(2, 5));
			// 	let arrayTarget = scheduleObject[`${e.target.id.slice(0, 1)}`];
			// 	let index = arrayTarget.findIndex((e) => {
			// 		return e === findTarget;
			// 	});
			// 	if (index > -1) {
			// 		arrayTarget.splice(index, 1);
			// 	}
			// 	console.log(arrayTarget);

			// 	e.target.innerHTML = "";
			// 	e.target.removeEventListener("click", closure.handleRemove);
			// 	e.target.addEventListener("click", closure.handleCreate);
			// };
		})();
	})();

	const buildTable = () => {
		let tbody = document.getElementById("tbody");
		tbody.innerHTML = "";
		dayArray.forEach((day, index) => {
			let tr = document.createElement("tr");
			let td = document.createElement("td");
			td.innerText = day;
			tr.appendChild(td);
			timeArray.forEach((time) => {
				let td = document.createElement("td");
				td.addEventListener("mousedown", closure.dragStart);
				td.addEventListener("mouseup", closure.dragEnd);
				td.id = `${index}-${time}`;
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		});
	};

	function handleOnClick() {
		let data = {
			sect_id: params["sect_id"],
			std_for_id: params["std_for_id"],
			schedule: scheduleList,
			ecept_date: [],
		};

		postAdminSchedule(data).then((res) => setIsDone(true));

		handleOpen();
	}

	useEffect(() => {
		handleOpenForLoader();
		getAdminForeignerWork(params["sect_id"]).then((res) => {
			setForList(res.data);
		});
		getAdminSection({ sect_id: params["sect_id"] }).then((res) => setSectName(res.data));
		getAdminForeigner({ foreigners: [params["std_for_id"]] }).then((res) =>
			setForName(res.data)
		);

		buildTable();
	}, []);
	useEffect(() => {
		if (forList && forList.data) {
			handleCloseForLoader();
			setForList(forList.data);
		}
	}, [forList]);

	useEffect(() => {
		getAdminForeigner({ foreigners: [params["std_for_id"]] }).then((res) => {
			setForName(res.data);
			console.log(scheduleList);
			buildTable();
		});
	}, [params]);

	useEffect(() => {
		if (isDone) {
			handleClose();
			forList.forEach((v) => {
				if (v.std_for_name !== forName && !v.is_schedules_inputed) {
					history.push(`/section/${params["sect_id"]}/${v.std_for_id}`);
				}
			});
			history.push("/reload");
		}
	});
	return (
		<div className="content">
			<div className="sub_title">
				<p className="tit">
					{sectName && sectName.data && sectName.data.sect_name} 근무 시간표 편성
				</p>
			</div>

			<div className="search_student">
				<div className="left_wrap">
					<div className="tsearch">
						<input type="text" />
						<input type="submit" value="검색" />
					</div>
					<div className="not_enter">
						<p className="tit">미입력 리스트</p>
						<div className="scroll_area">
							<table>
								<thead>
									<tr>
										<th scope="col">학번</th>
										<th scope="col">이름</th>
										<th scope="col">근무시간</th>
									</tr>
								</thead>
								<tbody>
									{forList &&
										forList.length > 0 &&
										forList.map((v) => {
											if (!v.is_schedules_inputed) {
												return (
													<tr
														onClick={() => {
															history.push(
																`/section/${params["sect_id"]}/${v.std_for_id}`
															);
														}}
													>
														<td>{v.std_for_id}</td>
														<td className="name">{v.std_for_name}</td>
														<td></td>
													</tr>
												);
											}
										})}
								</tbody>
							</table>
						</div>
					</div>

					<div className="enter">
						<p className="tit">입력 완료 리스트</p>
						<div className="scroll_area">
							<table>
								<thead>
									<tr>
										<th scope="col">학번</th>
										<th scope="col">이름</th>
										<th scope="col">근무시간</th>
									</tr>
								</thead>
								<tbody>
									{forList &&
										forList.length > 0 &&
										forList.map((v, index) => {
											if (v.is_schedules_inputed) {
												return (
													<tr>
														<td>{v.std_for_id}</td>
														<td>{v.std_for_name}</td>
														<td>
															<button
																onClick={() => {
																	deleteAdminSchedule({
																		sect_id: params["sect_id"],
																		std_for_id: v.std_for_id,
																	}).then((res) =>
																		setIsDone(true)
																	);
																}}
															>
																삭제
															</button>
														</td>
													</tr>
												);
											}
										})}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<div className="right_wrap">
					<p className="tit">
						[{forName && forName.data && forName.data[0].std_for_name}] 스케줄 등록
					</p>
					<div className="save_btn" onClick={handleOnClick}>
						저장
					</div>
					<table className="work_time">
						<colgroup>
							<col width="9%" span="10" />
						</colgroup>
						<thead>
							<tr>
								<th rowspan="2" scope="col"></th>
								<th colspan="3" scope="col">
									AM
								</th>
								<th colspan="7" scope="col">
									PM
								</th>
							</tr>
							<tr>
								<th scope="col">9</th>
								<th scope="col">10</th>
								<th scope="col">11</th>
								<th scope="col">12</th>
								<th scope="col">1</th>
								<th scope="col">2</th>
								<th scope="col">3</th>
								<th scope="col">4</th>
								<th scope="col">5</th>
							</tr>
						</thead>
						<tbody id="tbody"></tbody>
					</table>
				</div>
			</div>
			<Modal isOpen={isOpenForLoader}>
				<Loader />
			</Modal>
			<Modal isOpen={isOpen}>
				<Loader />
			</Modal>
			{/* <div className="table_btn mb40">
				<div>업로드</div>
			</div> */}
		</div>
	);
}
