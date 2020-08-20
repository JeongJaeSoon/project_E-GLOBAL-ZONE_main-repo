<?php

namespace App\Http\Controllers;

use App\Model\Authenticator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LoginController extends Controller
{
    private const _LOGIN_ERROR = '아이디 또는 비밀번호를 다시 확인하세요.';
    private const _LOGIN_SUCCESS = ' 님 로그인 되습니다. 어서오세요';
    private const _LOGOUT_SUCCESS = '로그아웃되었습니다.';
    private const _PASSWORD_CHANGE_REQUIRE = '초기 비밀번호로 로그인하였습니다. 비밀번호 변경 후, 재접속 해주세요.';

    private const _ADMIN_INIT_PASSWORD = "IAC@23yju5630-115";
    private const _STD_FOR_INIT_PASSWORD = "1q2w3e4r!";

    /**
     * @var Authenticator
     */
    private $authenticator;
    private $validator;
    private $response_msg;


    public function __construct(Authenticator $authenticator)
    {
        $this->authenticator = $authenticator;
        $this->response_msg = self::_PASSWORD_CHANGE_REQUIRE;
    }

    /**
     * 로그인 시, 유효성 검사 실시
     *
     * @param Request $request
     * @param array $rules
     * @return bool
     */
    private function login_validator(
        Request $request,
        array $rules
    ): bool
    {
        $this->validator = Validator::make($request->all(), [
            $rules['key'] => 'required|string',
            'password' => 'required|string|min:8',
            'provider' => 'required|string|in:' . $rules['prov'],
        ]);

        if ($this->validator->fails()) {
            return false;
        }

        return true;
    }

    /**
     * 로그인 시, 사용자 정보 인증
     *
     * @param Request $request
     * @param string $key
     * @return array|null
     */
    private function login_authenticator(
        Request $request,
        string $key
    ): ?array
    {
        $credentials = array_values($request->only($key, 'password', 'provider'));
        $credentials[] = $key;

        if (!$user = $this->authenticator->attempt(...$credentials)) {
            return null;
        }

        $token = '';
        //TODO 비밀번호 환경변수 설정 ( 최종루트는 env )
        $initial_password = [
            'admins' => self::_ADMIN_INIT_PASSWORD,
            'foreigners' => self::_STD_FOR_INIT_PASSWORD
        ];

        if ($initial_password[$credentials[2]] !== $credentials[1]) {
            $token = $user->createToken(ucfirst($credentials[2]) . ' Token')->accessToken;
        }

        return [
            'result' => $user,
            'token' => $token
        ];
    }

    /**
     * 관리자 로그인
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function adminLogin(Request $request): JsonResponse
    {
        $rules = [
            'key' => 'account',
            'prov' => 'admins'
        ];

        if (!$this->login_validator($request, $rules)) {
            return response()->json([
                'message' => $this->validator->errors(),
            ], 422);
        }

        if (empty($admin = $this->login_authenticator($request, $rules['key']))) {
            return response()->json([
                'message' => self::_LOGIN_ERROR
            ], 401);
        }

        if (!empty($admin['token'])) {
            $this->response_msg = $admin['result']['name'] . self::_LOGIN_SUCCESS;
        }

        return response()->json([
            'message' => $this->response_msg,
            'name' => $admin['result']['name'],
            'access_token' => $admin['token']
        ], 200);
    }

    /**
     * 외국인 유학생 로그인
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function foreignerLogin(Request $request): JsonResponse
    {
        $rules = [
            'key' => 'std_for_id',
            'prov' => 'foreigners'
        ];

        if (!$this->login_validator($request, $rules)) {
            return response()->json([
                'message' => $this->validator->errors(),
            ], 422);
        }

        if (empty($foreigner = $this->login_authenticator($request, $rules['key']))) {
            return response()->json([
                'message' => self::_LOGIN_ERROR
            ], 401);
        }

        if (!empty($admin['token'])) {
            $this->response_msg = $foreigner['result']['std_for_name'] . self::_LOGIN_SUCCESS;
        }

        return response()->json([
            'message' => $this->response_msg,
            'id' => $foreigner['result']['std_for_id'],
            'name' => $foreigner['result']['std_for_name'],
            'lang' => $foreigner['result']['std_for_lang'],
            'country' => $foreigner['result']['std_for_country'],
            'favorite' => $foreigner['result']['std_for_state_of_favorite'],
            'access_token' => $foreigner['token']
        ], 200);
    }

    /**
     * 관리자, 유학생 로그아웃
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user($request['guard'])->token()->revoke();

        return response()->json([
            'message' => self::_LOGOUT_SUCCESS
        ], 200);
    }

    public function adminRequest(Request $request)
    {
        $admin = $request->user($request['guard']);

        return response()->json([
            'name' => $admin['name']
        ], 200);
    }

    public function foreignerRequest(Request $request)
    {
        $foreigner = $request->user($request['guard']);

        return response()->json([
            'id' => $foreigner['std_for_id'],
            'name' => $foreigner['std_for_name'],
            'lang' => $foreigner['std_for_lang'],
            'country' => $foreigner['std_for_country'],
            'favorite' => $foreigner['std_for_state_of_favorite'],
        ], 200);
    }
}
