import * as React from "react"
import * as queryString from "query-string"
import * as superagent from "superagent"
import { AgGridColumn, AgGridReact } from "ag-grid-react"
import { ColDef, ColGroupDef } from "ag-grid"
import { AnswerCellRendererComponent } from "./answer-cell-renderer"

import 'ag-grid/dist/styles/ag-grid.css'
import 'ag-grid/dist/styles/ag-theme-fresh.css'
import { GridReadyEvent } from "ag-grid/dist/lib/events";
import { GridApi } from "ag-grid/dist/lib/gridApi";

export interface AppComponentProps {}

export interface AppComponentState {
  fatalError: any
  usingFakeData: boolean
  reportStep: "Loading portal data" | "Loading MCBKT data" | "Generating report" | null
  reportData: TableData|null
  filter: string
  showToolPanel: boolean
  showNames: boolean
}

export interface AppQueryParams {
  token?: string
  offering?: string
}

export interface PortalOfferingStudent {
  endpoint_url: string|null
  name: string
  started_activity: boolean
  user_id: number
  username: string
}

export interface PortalOffering {
  activity: string
  activity_url: string
  clazz: string
  clazz_id: number
  students: PortalOfferingStudent[]
  teacher: string
}

// NOTE: there is a lot of other data in the PortalReportData and PortalReport
// but since it is not used in this report I didn't bother to add it to the interface type
export interface PortalReportData {
  report: PortalReport
  class: {
    name: string,
    students: PortalReportStudent[]
  }
}

export interface PortalReportStudent {
  id: number
  name: string
  first_name: string
  last_name: string
  started_offering: boolean
}

export interface PortalReport {
  name: string
  children: PortalReportSection[]
}

export interface PortalReportSection {
  id: number
  type: "Section"
  name: string
  children: PortalReportPage[]
}

export interface PortalReportPage {
  id: number
  type: "Page"
  name: string
  url: string
  children: PortalReportQuestion[]
}

export interface PortalReportQuestion {
  id: number
  name: string
  description: string
  prompt: string
  enable_rationale: boolean
  rationale_prompt: string
  allow_multiple_selection: boolean|null
  is_required: boolean
  key: string
  type: string
  question_number: number
  answers: PortalReportAnswer[]
  feedback_enabled: boolean
  score_enabled: boolean
  max_score: number
  choices: ReportReportChoice[]
}

export interface PortalReportAnswer {
  answer: PortalReportStudentAnswer|null
  answer_type: string
  feedbacks: PortalReportFeedback[]
  answered: boolean
  submitted: boolean
  question_required: boolean
  is_correct: boolean
  type: string
  embeddable_key: string
  student_id: number
}

export interface PortalReportStudentAnswer {
  id: string
  choice: string
  is_correct: boolean
}

export interface PortalReportFeedback {
  answer: PortalReportFeedbackAnswer[]
  answer_key: string
  score: number|null
  feedback: string|null
  has_been_reviewed: boolean
}

export interface PortalReportFeedbackAnswer {
  choice_id: number
  answer: string
  correct: boolean
  feedback: string|null
}

export interface ReportReportChoice {
  id: number
  choice: string
  is_correct: boolean
}

export interface MCBKTStudentDataMap {
  [key: string]: MCBKTStudentData
}

export interface MCBKTStudentData {
  MCBKT_parameters: MCBKTParameters
  cluster: string
  cluster_description: string
  cluster_short: string
  game_stage: number
  scores: number[]
  time_span: number
}

export interface MCBKTParameters {
  M: number
  pg: number
  pli: number
  ps: number
  pt: number
}

export interface GamePageData {
  name: string
  numLevels: number
}

export interface StudentData {
  id: number
  name: string
  startedActivity: boolean
  overallScore: number,
  preTestAnswers: StudentMultipleChoiceAnswer[][]
  gameClusters: string[]
  postTestAnswers: StudentMultipleChoiceAnswer[][]
}

export interface StudentMultipleChoiceAnswer {
  answered: boolean
  correct: boolean
}

export interface StudentMultipleChoiceAnswerMap {
  [key: string]: StudentMultipleChoiceAnswer
}

export interface TableData {
  activityName: string
  teacher: string
  preTestPages: PortalReportPage[]
  gamePage: GamePageData
  postTestPages: PortalReportPage[]
  rowData: any[]
}

export class AppComponent extends React.Component<AppComponentProps, AppComponentState> {
  token: string
  offeringUrl: string
  icons: any
  gridApi: GridApi|null

  constructor (props:AppComponentProps) {
    super(props)
    this.state = {
      filter: "",
      showToolPanel: false,
      fatalError: null,
      usingFakeData: false,
      reportStep: "Loading portal data",
      reportData: null,
      showNames: true
    }
    this.icons = {
      columnRemoveFromGroup: '<i class="fa fa-remove"/>',
      filter: '<i class="fa fa-filter"/>',
      sortAscending: '<i class="fa fa-long-arrow-down"/>',
      sortDescending: '<i class="fa fa-long-arrow-up"/>',
      groupExpanded: '<i class="fa fa-minus-square-o"/>',
      groupContracted: '<i class="fa fa-plus-square-o"/>'
    }
  }

  componentWillMount() {
    const params:AppQueryParams = queryString.parse(window.location.search)
    const {token, offering} = params
    if (token && offering) {
      // set as member to allow for reloads
      this.token = token
      this.offeringUrl = offering
      this.loadPortalData()
    }
    else {
      this.loadFakeData()
    }
  }

  loadPortalData() {
    this.setState({reportStep: "Loading portal data"})
    superagent
      .get(this.offeringUrl)
      .set("Authorization", `Bearer ${this.token}`)
      .end((err, res) => {
        if (err) {
          return this.setState({fatalError: (res.body ? res.body.message : null) || err})
        }
        const portalOffering:PortalOffering = res.body

        const reportUrl = this.offeringUrl.replace("/offerings/", "/reports/")
        superagent
          .get(reportUrl)
          .set("Authorization", `Bearer ${this.token}`)
          .end((err, res) => {
            if (err) {
              return this.setState({fatalError: (res.body ? res.body.message : null) || err})
            }
            const portalReportData:PortalReportData = res.body
            this.loadMCBKTData(portalOffering, portalReportData)
          })
      })
  }

  loadMCBKTData(portalOffering:PortalOffering, portalReportData:PortalReportData) {
    this.setState({reportStep: "Loading MCBKT data"})
    const endPoints = portalOffering.students
      .filter((student) => !!student.endpoint_url)
      .map((student) => student.endpoint_url)
    superagent
      .post("https://physicsfront.com/_up/mcbkt/look-up")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send({run_remote_endpoint: endPoints})
      .end((err, res) => {
        if (err) {
          return this.setState({fatalError: err})
        }
        try {
          // currently the request is returning "content-type:text/html; charset=utf-8" which
          // causes superagent not to parse the body automatically.  In case this changes check
          // both the body and then parse the text as json
          const mcbktStudentDataMap:MCBKTStudentDataMap = res.body || JSON.parse(res.text)
          this.generateReportData(portalOffering, portalReportData, mcbktStudentDataMap)
        }
        catch (e) {
          this.setState({fatalError: "Unable to decode MCBKT response data"})
        }
      })
  }

  loadFakeData() {
    // TODO
    this.setState({usingFakeData: true})
  }

  generateReportData(portalOffering:PortalOffering, portalReportData:PortalReportData, mcbktStudentDataMap:MCBKTStudentDataMap) {
    const previousReportData = this.state.reportData

    const portalReport = portalReportData.report
    const pages = portalReport.children[0].children
    const gamePage = pages.find((page) => page.children.length === 1 && page.children[0].type === "Embeddable::Iframe")
    if (!gamePage) {
      return this.setState({fatalError: "Unable to find game page in portal report data"})
    }

    const preTestPages = pages.filter((page) => !!page.name.match(/pre-test|pre test/i))
    const postTestPages = pages.filter((page) => !!page.name.match(/post-test|post test/i))

    // this is hacky but the offering data returns user ids whereas the report data returns student ids
    // so we need to use the student name to map to the offering to the report data
    const portalReportMap:any = {}
    portalReportData.class.students.forEach((student) => {
      portalReportMap[student.name] = student.id
    })
    const studentNameToIdMap:any = {}
    portalOffering.students.forEach((student) => {
      studentNameToIdMap[student.name] = portalReportMap[student.name]
    })

    const getStudentAnswers = (pages:PortalReportPage[], student_id: number) => {
      const answers:StudentMultipleChoiceAnswerMap = {}
      pages.map((page) => {
        page.children.map((question) => {
          const answer = question.answers.find((answer) => answer.student_id == student_id)
          const studentAnswer:StudentMultipleChoiceAnswer = {
            answered: answer ? !!answer.answer : false,
            correct: answer ? answer.is_correct : false
          }
          answers[`p${page.id}q${question.id}`] = studentAnswer
        })
      })
      return answers
    }

    this.setState({reportStep: "Generating report"}, () => {
      const numLevels = 4

      const rowData:any[] = portalOffering.students.map((student, studentIndex) => {
        const id = studentNameToIdMap[student.name]
        const mcbktData = student.endpoint_url ? mcbktStudentDataMap[student.endpoint_url] || null : null

        // TODO: compute overall score
        const overallScore = 0

        // TODO: figure out how to get multiple game levels since the api only returns one cluster result for the student
        const gameLevels:any = {
          level1: mcbktData ? mcbktData.cluster : ""
        }
        for (let i = 2; i <= numLevels; i++) {
          gameLevels[`level${i}`] = ""
        }

        const row:any = {
          id: student.user_id,
          selected: false,
          name: student.name,
          anonymous: `Student ${studentIndex+1}`,
          overallScore
        }
        Object.assign(row, getStudentAnswers(preTestPages, id))
        Object.assign(row, getStudentAnswers(postTestPages, id))
        Object.assign(row, gameLevels)
        return row
      })

      const reportData:TableData = {
        activityName: portalReport.name,
        teacher: portalOffering.teacher,
        preTestPages,
        gamePage: {
          name: gamePage.name,
          numLevels: numLevels
        },
        postTestPages,
        rowData
      }
      this.setState({reportStep: null, reportData: reportData})
    })
  }

  refs: {
    filter: HTMLInputElement
    toolPanelCheckbox: HTMLInputElement
  }

  // NOTE: using `fn = () => {`  gets around having to bind `this` to all the onXXX handlers in the renderReport() method

  handleFilterChange = () => {
    this.setState({filter: this.refs.filter.value.trim()})
  }

  handleRefreshButton = () => {
    this.loadPortalData()
  }

  handleSelectAllButton = () => {
    if (this.gridApi) {
      this.gridApi.selectAll()
    }
  }

  handleUnSelectButton = () => {
    if (this.gridApi) {
      this.gridApi.deselectAll()
    }
  }

  handleHideNamesButton = () => {
    this.setState({showNames: false})
  }

  handleShowNamesButton = () => {
    this.setState({showNames: true})
  }

  handleToolPanelCheckboxChange = () => {
    alert("This checkbox does nothing currently...")
    this.setState({showToolPanel: this.refs.toolPanelCheckbox.checked})
  }

  handleGridReady = (params:GridReadyEvent) => {
    this.gridApi = params.api
  }

  renderReport(reportData:TableData) {
    const createTestColumns = (pages:PortalReportPage[]) => {
      return pages.map((page) => {
        return  {
          headerName: page.name,
          children: page.children.map((question, index) => {
            return {
              headerName: `Q${index+1}`,
              field: `p${page.id}q${question.id}`,
              width: 60,
              pinned: true,
              cellRendererFramework: AnswerCellRendererComponent
            }
          })
        }
      })
    }

    const gameLevels:number[] = []
    for (let i = 1; i <= 4; i++) {
      gameLevels.push(i)
    }

    let reportColumnDefs:(ColDef|ColGroupDef)[] = [
      {
        headerName: "#",
        width: 30,
        checkboxSelection: true,
        suppressSorting: true,
        suppressMenu: true,
        suppressFilter: true,
        pinned: true
      },
      {
        headerName: "Student",
        field: "student",
        children: [
          {
            headerName: "Name",
            field: this.state.showNames ? "name" : "anonymous",
            width: 160,
            pinned: true
          },
          {
            headerName: "Overall",
            field: "overallScore",
            width: 100,
            pinned: true
          }
        ]
      }
    ]
    reportColumnDefs = reportColumnDefs.concat(createTestColumns( reportData.preTestPages))
    reportColumnDefs.push({
      headerName: reportData.gamePage.name,
      children: gameLevels.map((level) => {
        return {
          headerName: `Level ${level}`,
          field: `level${level}`,
          width: 100,
          pinned: true,
          editable: false
        }
      })
    })
    reportColumnDefs = reportColumnDefs.concat(createTestColumns(reportData.postTestPages))

    return (
      <div className="report">
        <h1>UKDE Dashboard for {reportData.activityName}</h1>
        <h2>Class of {reportData.teacher}</h2>
        <div>
          <input type="text" placeholder="Type text to filter..." ref="filter" value={this.state.filter} onChange={this.handleFilterChange} />
          <div className="buttons">
            <div className="button-group">
              <button onClick={this.handleRefreshButton}>Refresh</button>
            </div>
            <div className="button-group">
              <button onClick={this.handleSelectAllButton}>Select All</button>
              <button onClick={this.handleUnSelectButton}>Un-select</button>
            </div>
            <div className="button-group">
              <button onClick={this.handleHideNamesButton}>Hide Names</button>
              <button onClick={this.handleShowNamesButton}>Show Names</button>
            </div>
          </div>
          <input type="checkbox" ref="toolPanelCheckbox" onChange={this.handleToolPanelCheckboxChange} />Show Tool Panel
        </div>
        <div className="ag-theme-fresh report-table">
          <AgGridReact
            onGridReady={this.handleGridReady}
            showToolPanel={this.state.showToolPanel}
            quickFilterText={this.state.filter}
            icons={this.icons}
            rowData={reportData.rowData}
            columnDefs={reportColumnDefs}

            suppressRowClickSelection
            rowSelection="multiple"
            rowDeselection
            enableColResize
            enableSorting
            enableFilter
            rowHeight={22}
            rowModelType="inMemory" >
          </AgGridReact>
        </div>
      </div>
    )
  }

  renderFatalError(message:string) {
    return <div className="error">{message}</div>
  }

  renderProgress(message:string) {
    return <div className="progress">{message}</div>
  }

  render() {
    const {fatalError, reportData, reportStep} = this.state

    if (fatalError) {
      return this.renderFatalError(fatalError.toString())
    }
    if (reportStep) {
      return this.renderProgress(`${reportStep}...`)
    }
    if (reportData) {
      return this.renderReport(reportData)
    }
    return this.renderProgress("Loading...")
  }
}