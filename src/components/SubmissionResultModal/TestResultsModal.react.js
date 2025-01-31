// @flow
import React from "react";
import { Alert, AlertTitle } from "@material-ui/lab";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Divider from "@material-ui/core/Divider";
import CircularProgress from "@material-ui/core/CircularProgress";
import { withStyles } from "@material-ui/core/styles";
import ReactDiffViewer from "react-diff-viewer";
import Typography from "@material-ui/core/Typography";
import SubmissionResultStatusIcon from "../../utils/icons";
import type { SubmissionResult } from "../../types";
import getText from "../../utils/messages";
import submissionsService from "../../services/submissionsService";
import ErrorNotification from "../../utils/ErrorNotification";
import MultipleTabsEditor from "../MultipleTabsEditor/MultipleTabsEditor.react";
import { withState } from "../../utils/State";

const styles = () => ({
  modal: {
    minHeight: "200px",
  },
  waitingDialog: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  dialogTitle: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "8px",
  },
  dialogTitleText: {
    alignSelf: "center",
    marginRight: "10px",
  },
  markAsDefinitiveButton: {
    alignSelf: "flex-end",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
  },
  codeEditor: {
    height: "500px",
    width: "100%",
    display: "flex",
    paddingBottom: "70px",
    flex: "1 0 auto",
  },
});

type Props = {
  handleCloseModal: Event => void,
  open: boolean,
  classes: any,
  context: any,
  showWaitingDialog: boolean,
  activitySubmissionId: number,
  courseId: number,
  activityFinalSubmissionId: ?number,
  onMarkSubmissionAsFinal: number => void,
};

type State = {
  error: { open: boolean, message: ?string },
  results: ?SubmissionResult,
  getResultsTimerId: ?IntervalID,
};

class SubmissionResultModal extends React.Component<Props, State> {
  state = {
    error: { open: false, message: null },
    results: null,
    getResultsTimerId: null,
  };

  componentDidMount() {
    const { activitySubmissionId } = this.props;
    const { getResultsTimerId } = this.state;
    if (activitySubmissionId !== null) {
      submissionsService
        .getSubmissionResult(activitySubmissionId)
        .then(submissionResult => {
          clearInterval(getResultsTimerId);
          this.setState({ getResultsTimerId: null, results: submissionResult });
        })
        .catch(({ err, status }) => {
          console.log(err);
          if (status === 404) {
            this.setState({
              getResultsTimerId: setInterval(() => this.pullForResults(activitySubmissionId), 3000),
            });
            return;
          }
          this.setState({
            error: {
              open: true,
              message: "Hubo un error al obtener el resultado. Por favor reintenta",
            },
          });
        });
    }
  }

  pullForResults(submissionId: number) {
    console.log("Pidiendo resultado");
    const { getResultsTimerId } = this.state;

    submissionsService
      .getSubmissionResult(submissionId)
      .then(submissionResult => {
        clearInterval(getResultsTimerId);
        this.setState({ getResultsTimerId: null, results: submissionResult });
      })
      .catch(({ err, status }) => {
        console.log(err);
        if (status === 404) {
          return;
        }
        this.setState({
          error: {
            open: true,
            message: "Hubo un error al obtener el resultado. Por favor reintenta",
          },
        });
      });
  }

  onClickMarkAsFinalSolution(activityId: number, submissionId: number) {
    const { courseId, onMarkSubmissionAsFinal } = this.props;
    submissionsService
      .putSolutionAsFinal(courseId, activityId, submissionId)
      .then(() => {
        onMarkSubmissionAsFinal(submissionId);
      })
      .catch(err => {
        console.log(err);
        if (status === 404) {
          return;
        }
        this.setState({
          error: {
            open: true,
            message: "Hubo un error al marcar la solución como definitiva. Por favor reintenta",
          },
        });
      });
  }

  onCloseModal(e) {
    const { handleCloseModal } = this.props;
    const { getResultsTimerId } = this.state;

    clearInterval(getResultsTimerId);
    handleCloseModal(e);
  }

  render() {
    const {
      classes,
      open,
      handleCloseModal,
      showWaitingDialog,
      activityFinalSubmissionId,
      context,
    } = this.props;
    const { results, error } = this.state;

    const title = results
      ? `Resultado de la corrida: ${getText(results.submission_status).toUpperCase()}`
      : "Corriendo pruebas";

    const getStdoutColor = item => {
      if (item.includes("start_BUILD") || item.includes("end_BUILD")) {
        return "secondary";
      }
      if (item.includes("start_RUN") || item.includes("end_RUN")) {
        return "primary";
      }
      return "textSecondary";
    };

    const getStderrColor = item => {
      if (item.includes("main") || item.includes("end_BUILD")) {
        return "secondary";
      }
      return "textSecondary";
    };

    return (
      <div>
        {error.open && <ErrorNotification open={error.open} message={error.message} />}

        <Dialog
          open={open}
          onClose={e => this.onCloseModal(e)}
          scroll="paper"
          aria-labelledby="scroll-dialog-title"
          aria-describedby="scroll-dialog-description"
          className={classes.modal}
          fullWidth
          maxWidth={results ? "lg" : "xs"}
        >
          <DialogTitle id="scroll-dialog-title" className={classes.dialogTitle} disableTypography>
            <Typography
              variant="h5"
              color="textSecondary"
              component="p"
              className={classes.dialogTitleText}
            >
              {title}
            </Typography>
            {results && (
              <SubmissionResultStatusIcon
                isFinalSolution={results.is_final_solution}
                submissionStatus={results.submission_status}
              />
            )}
          </DialogTitle>
          {!results && showWaitingDialog && (
            <DialogContent dividers className={classes.waitingDialog}>
              <DialogContentText id="scroll-dialog-description" tabIndex={-1}>
                Esto puede tardar unos segundos
              </DialogContentText>
              <CircularProgress />
            </DialogContent>
          )}

          {results && (
            <DialogContent dividers className={classes.dialogContent}>
              {/* Mark as definitive (if success) */}
              {!context.permissions.includes("activity_manage") && (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    results.submission_status !== "SUCCESS" || activityFinalSubmissionId !== null
                  }
                  className={classes.markAsDefinitiveButton}
                  onClick={() => this.onClickMarkAsFinalSolution(results.activity_id, results.id)}
                >
                  Marcar como solucion definitiva
                </Button>
              )}
              {/* IO test results (if any) */}
              {results.io_test_run_results.length > 0 && (
                <Typography variant="h5" color="black" component="p">
                  Tests de entrada/salida:
                </Typography>
              )}
              {results.io_test_run_results &&
                results.io_test_run_results.map((ioResult, idx) => {
                  const result =
                    ioResult.expected_output === ioResult.run_output ? "success" : "error";
                  const allGoodStyle =
                    result === "success"
                      ? {
                          variables: {
                            light: {
                              diffViewerBackground: "#fff",
                            },
                          },
                        }
                      : {};
                  const separateNewLines = str => (
                    str.replace(/(\n)\1+/g, str => str.split('').join(' '))
                  );
                  // Hack to fix issue #97 where '\n\n' is not displayed in diff viewer correctly but '\n \n' does
                  ioResult.run_output = separateNewLines(ioResult.run_output);
                  ioResult.expected_output = separateNewLines(ioResult.expected_output);
                  return (
                    <DialogContentText
                      key={idx}
                      id="scroll-dialog-description"
                      tabIndex={-1}
                      component="div"
                    >
                      <Alert severity={result}>
                        <AlertTitle>{ioResult.name}</AlertTitle>
                      </Alert>
                      <ReactDiffViewer
                        styles={allGoodStyle}
                        key={ioResult.id}
                        leftTitle="Resultado de la corrida"
                        oldValue={ioResult.run_output}
                        rightTitle="Resultado esperado"
                        newValue={ioResult.expected_output}
                        showDiffOnly={false}
                        splitView
                      />
                      <br />
                    </DialogContentText>
                  );
                })}
              {/* Unit test results (if any) */}
              {results.unit_test_run_results.length > 0 && (
                <Typography variant="h5" color="black" component="p">
                  Tests unitarios:
                </Typography>
              )}
              {results.unit_test_run_results &&
                results.unit_test_run_results
                  .sort((a, b) => (a.test_name > b.test_name ? 1 : -1))
                  .map((unitTestResult, idx) => {
                    const result = unitTestResult.passed ? "success" : "error";
                    return (
                      <DialogContentText
                        key={idx}
                        id="scroll-dialog-description"
                        tabIndex={-1}
                        component="div"
                      >
                        <Alert severity={result}>
                          <AlertTitle>{unitTestResult.test_name.replace(/_/g, " ")}</AlertTitle>
                          {unitTestResult.error_messages &&
                            unitTestResult.error_messages.split("\n").map((line, key) => {
                              if (
                                key === 0 ||
                                key === unitTestResult.error_messages.split("\n").length - 2
                              ) {
                                return <span>{line}</span>;
                              }
                              return (
                                <span>
                                  <blockquote>{line}</blockquote>
                                </span>
                              );
                            })}
                        </Alert>
                      </DialogContentText>
                    );
                  })}
              <br />
              {results.submission_status.includes("ERROR") && (
                <div>
                  <Divider variant="middle" />
                  <br />
                  <Typography variant="h5" color="black" component="p">
                    MENSAJE DE ERROR:
                  </Typography>
                  <br />
                  <Typography variant="subtitle1" color="textSecondary" component="p">
                    {results.exit_message}
                  </Typography>
                  <br />
                </div>
              )}
              {results.submited_code && (
                <div className={classes.codeEditor}>
                  <MultipleTabsEditor
                    width="100%"
                    initialCode={results.submited_code}
                    language={results.activity_language}
                    readOnly
                  />
                </div>
              )}
              {results.stderr && (
                <div>
                  <Divider variant="middle" />
                  <br />
                  <Typography variant="h5" color="black" component="p">
                    STDERR:
                  </Typography>
                  <br />
                  {results.stderr.split("\n").map((item, key) => (
                    <Typography
                      key={key}
                      variant="subtitle1"
                      color={getStderrColor(item)}
                      component="p"
                    >
                      {item}
                    </Typography>
                  ))}
                </div>
              )}
              <br />
              <Divider variant="middle" />
              <br />
              <Typography variant="h5" color="black" component="p">
                STDOUT:
              </Typography>
              <br />
              {results.stdout &&
                results.stdout.split("\n").map((item, key) => (
                  <Typography
                    key={key}
                    variant="subtitle1"
                    color={getStdoutColor(item)}
                    component="p"
                  >
                    {item}
                  </Typography>
                ))}
              <DialogActions>
                <Button onClick={e => handleCloseModal(e)} color="primary">
                  Cerrar
                </Button>
              </DialogActions>
            </DialogContent>
          )}
        </Dialog>
      </div>
    );
  }
}

export default withState(withStyles(styles)(SubmissionResultModal));
